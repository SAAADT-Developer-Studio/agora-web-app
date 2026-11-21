import { sql } from "drizzle-orm";
import type { Database } from "~/lib/db";
import { BiasRatingKey, type BiasRating } from "~/enums/biasRatingKey";
import { biasSide, type BiasSide } from "~/utils/biasSide";

/** Window every coverage metric is measured over. */
export const LANDSCAPE_WINDOW_DAYS = 30;
/** A story counts as "big" when this many outlets covered it in the window. */
export const BIG_STORY_MIN_OUTLETS = 5;
/** Reader votes below this are too few to call agreement or disagreement. */
export const MIN_VOTES_FOR_VERDICT = 10;
/** MOSS rows older than this (vs the newest MOSS run) are dropped as stale. */
const MOSS_MAX_STALENESS_DAYS = 75;

export type OutletReach = {
  /** Monthly real users (MOSS). */
  people: number;
  /** Share of the Slovenian online population reached monthly. */
  percent: number;
  avgSessionDuration: string;
  /** Month-over-month change in percent. */
  trend: number;
  measuredAt: string;
};

export type OutletVotes = {
  total: number;
  byRating: Record<BiasRating, number>;
  /** Share of votes on the same side (left/center/right) as the rating. */
  agreement: number | null;
  /** Side most voters picked; null below MIN_VOTES_FOR_VERDICT. */
  readersSide: BiasSide | null;
};

export type MediaOutlet = {
  key: string;
  name: string;
  url: string;
  biasRating: BiasRating | null;
  side: BiasSide | null;
  owner: string | null;
  reach: OutletReach | null;
  articles: number;
  /** 0..1 */
  paywallShare: number;
  topCategories: { key: string; share: number }[];
  /** Stories covered that at least 3 outlets reported. */
  sharedStories: number;
  /** Count of `MediaLandscape.bigStories` this outlet covered. */
  bigStoriesCovered: number;
  /** 0..1 share of covered shared stories where this outlet published first. */
  firstShare: number;
  medianLagMinutes: number | null;
  votes: OutletVotes;
  /** Outlets whose story picks overlap most (Jaccard 0..1). */
  similar: { key: string; overlap: number }[];
  /** Closest-overlapping outlet rated on a different side. */
  counterpart: { key: string; overlap: number } | null;
  /**
   * Who else covers the stories this outlet picks, relative to the average
   * outlet: -1 picks like left-rated outlets, +1 like right-rated ones.
   * Null when there are too few stories to say.
   */
  agenda: number | null;
  /** Scraper coverage is too thin for the numbers to mean much. */
  limitedData: boolean;
};

/** A story at least BIG_STORY_MIN_OUTLETS outlets covered in the window. */
export type BigStory = {
  id: number;
  title: string;
  lastArticleAt: string;
  outlets: string[];
};

export type MediaLandscape = {
  outlets: MediaOutlet[];
  /** Most widely covered first. */
  bigStories: BigStory[];
  windowDays: number;
  generatedAt: string;
};

const BIAS_KEYS = Object.values(BiasRatingKey) as BiasRating[];

function isBiasRating(value: string | null): value is BiasRating {
  return value !== null && (BIAS_KEYS as string[]).includes(value);
}

/** "PRO PLUS, d.o.o." → "PRO PLUS"; "Mladina časopisno podjetje d.d., Ljubljana" → "Mladina". */
export function cleanOwnerName(publisher: string): string {
  let name = publisher.split(",")[0].trim();
  name = name
    .replace(/\s+d\.\s?o\.\s?o\.?$/i, "")
    .replace(/\s+d\.d\.?$/i, "")
    .replace(/\s+časopisno podjetje$/i, "")
    .replace(/\s+informativne vsebine$/i, "")
    .trim();
  return name;
}

type Rows<T> = { rows: T[] };

export async function fetchMediaLandscape(db: Database): Promise<MediaLandscape> {
  const windowStart = sql`now() - make_interval(days => ${LANDSCAPE_WINDOW_DAYS})`;

  const [providers, moss, articleStats, categories, coverage, bigRows, votes, pairs, agenda] =
    (await Promise.all([
      db.execute(sql`select key, name, url, bias_rating from news_provider order by rank, name`),
      db.execute(sql`
        select distinct on (provider_key) provider_key, publisher, reach, reach_percent,
          avg_session_duration, trend, created_at
        from moss_data
        where created_at > (select max(created_at) from moss_data) - make_interval(days => ${MOSS_MAX_STALENESS_DAYS})
        order by provider_key, created_at desc`),
      db.execute(sql`
        select news_provider_key k, count(*)::int n,
          avg(case when is_paywalled then 1 else 0 end)::float paywall
        from article where published_at > ${windowStart}
        group by 1`),
      db.execute(sql`
        select k, cat, share from (
          select news_provider_key k, cat, count(*)::float / sum(count(*)) over (partition by news_provider_key) share,
            row_number() over (partition by news_provider_key order by count(*) desc) rn
          from article, unnest(categories) cat
          where published_at > ${windowStart}
          group by 1, 2) x
        where rn <= 3`),
      db.execute(sql`
        with sp as (
          select s.story_id, a.news_provider_key k, min(a.published_at) t
          from story_article s join article a on a.id = s.article_id
          where a.published_at > ${windowStart} group by 1, 2),
        st as (select story_id, count(*) n, min(t) first_t from sp group by 1 having count(*) >= 3)
        select k, count(*)::int shared,
          avg(case when t = first_t then 1 else 0 end)::float first_share,
          percentile_cont(0.5) within group (order by extract(epoch from t - first_t) / 60)::float lag
        from sp join st using (story_id) group by k`),
      db.execute(sql`
        with sp as (
          select distinct s.story_id, a.news_provider_key k
          from story_article s join article a on a.id = s.article_id
          where a.published_at > ${windowStart}),
        big as (select story_id from sp group by 1 having count(*) >= ${BIG_STORY_MIN_OUTLETS})
        select st.id,
          coalesce((select ss.title from story_summary ss where ss.story_id = st.id order by ss.id desc limit 1), st.title) title,
          st.last_article_published_at last_at,
          array_agg(sp.k order by sp.k) outlets
        from big join sp using (story_id) join story st on st.id = big.story_id
        group by st.id, st.title, st.last_article_published_at`),
      db.execute(sql`select provider_id k, value, count(*)::int n from vote group by 1, 2`),
      db.execute(sql`
        with sp as (
          select distinct s.story_id, a.news_provider_key k
          from story_article s join article a on a.id = s.article_id
          where a.published_at > ${windowStart}),
        st as (select story_id from sp group by 1 having count(*) >= 3),
        sp3 as (select sp.* from sp join st using (story_id)),
        cnt as (select k, count(*) c from sp3 group by k)
        select x.k a, y.k b, (count(*)::float / (ca.c + cb.c - count(*)))::float overlap
        from sp3 x join sp3 y on x.story_id = y.story_id and x.k <> y.k
        join cnt ca on ca.k = x.k join cnt cb on cb.k = y.k
        group by x.k, y.k, ca.c, cb.c`),
      db.execute(sql`
        with sp as (
          select distinct s.story_id, a.news_provider_key k,
            case when p.bias_rating in ('left', 'center-left') then -1
                 when p.bias_rating in ('right', 'center-right') then 1 else 0 end side
          from story_article s join article a on a.id = s.article_id
          join news_provider p on p.key = a.news_provider_key
          where a.published_at > ${windowStart} and p.bias_rating is not null),
        st as (
          select story_id, count(*) n, sum(side) net from sp group by 1 having count(*) >= 3)
        select k, count(*)::int n, avg((st.net - sp.side)::float / (st.n - 1))::float raw
        from sp join st using (story_id) group by k`),
    ])) as unknown as [
      Rows<{ key: string; name: string; url: string; bias_rating: string | null }>,
      Rows<{
        provider_key: string;
        publisher: string;
        reach: number;
        reach_percent: number;
        avg_session_duration: string;
        trend: number;
        created_at: string | Date;
      }>,
      Rows<{ k: string; n: number; paywall: number }>,
      Rows<{ k: string; cat: string; share: number }>,
      Rows<{ k: string; shared: number; first_share: number; lag: number | null }>,
      Rows<{ id: number; title: string; last_at: string | Date; outlets: string[] }>,
      Rows<{ k: string; value: string; n: number }>,
      Rows<{ a: string; b: string; overlap: number }>,
      Rows<{ k: string; n: number; raw: number }>,
    ];

  const mossBy = new Map(moss.rows.map((r) => [r.provider_key, r]));
  const articlesBy = new Map(articleStats.rows.map((r) => [r.k, r]));
  const coverageBy = new Map(coverage.rows.map((r) => [r.k, r]));

  const categoriesBy = new Map<string, { key: string; share: number }[]>();
  for (const r of categories.rows) {
    const list = categoriesBy.get(r.k) ?? [];
    list.push({ key: r.cat, share: Number(r.share) });
    categoriesBy.set(r.k, list);
  }
  for (const list of categoriesBy.values()) list.sort((a, b) => b.share - a.share);

  const votesBy = new Map<string, Record<BiasRating, number>>();
  for (const r of votes.rows) {
    if (!isBiasRating(r.value)) continue;
    const rec =
      votesBy.get(r.k) ??
      (Object.fromEntries(BIAS_KEYS.map((k) => [k, 0])) as Record<BiasRating, number>);
    rec[r.value] += Number(r.n);
    votesBy.set(r.k, rec);
  }

  const pairsBy = new Map<string, { key: string; overlap: number }[]>();
  for (const r of pairs.rows) {
    const list = pairsBy.get(r.a) ?? [];
    list.push({ key: r.b, overlap: Number(r.overlap) });
    pairsBy.set(r.a, list);
  }
  for (const list of pairsBy.values()) list.sort((a, b) => b.overlap - a.overlap);

  // Agenda: centre on the average outlet so the dominant number of
  // left-rated outlets doesn't push everyone "left", then scale to -1..1.
  const agendaSolid = agenda.rows.filter((r) => r.n >= 30);
  const agendaMean =
    agendaSolid.reduce((s, r) => s + Number(r.raw), 0) / Math.max(agendaSolid.length, 1);
  const agendaSpread = Math.max(
    ...agendaSolid.map((r) => Math.abs(Number(r.raw) - agendaMean)),
    1e-6,
  );
  const agendaBy = new Map(
    agendaSolid.map((r) => [r.k, (Number(r.raw) - agendaMean) / agendaSpread]),
  );

  const sideOf = new Map(
    providers.rows.map((p) => [p.key, biasSide(p.bias_rating)] as const),
  );

  const outlets: MediaOutlet[] = providers.rows.map((p) => {
    const m = mossBy.get(p.key);
    const a = articlesBy.get(p.key);
    const c = coverageBy.get(p.key);
    const side = biasSide(p.bias_rating);
    const byRating =
      votesBy.get(p.key) ??
      (Object.fromEntries(BIAS_KEYS.map((k) => [k, 0])) as Record<BiasRating, number>);
    const total = BIAS_KEYS.reduce((s, k) => s + byRating[k], 0);
    const sideTotals: Record<BiasSide, number> = { left: 0, center: 0, right: 0 };
    for (const k of BIAS_KEYS) sideTotals[biasSide(k)!] += byRating[k];
    const enough = total >= MIN_VOTES_FOR_VERDICT;
    const readersSide = enough
      ? (Object.entries(sideTotals).sort((x, y) => y[1] - x[1])[0][0] as BiasSide)
      : null;
    const similarAll = pairsBy.get(p.key) ?? [];
    const counterpart =
      side === null
        ? null
        : (similarAll.find((s) => {
            const other = sideOf.get(s.key);
            return other && other !== side && other !== "center";
          }) ??
          similarAll.find((s) => {
            const other = sideOf.get(s.key);
            return other && other !== side;
          }) ??
          null);

    return {
      key: p.key,
      name: p.name,
      url: p.url,
      biasRating: isBiasRating(p.bias_rating) ? p.bias_rating : null,
      side,
      owner: m ? cleanOwnerName(m.publisher) : null,
      reach: m
        ? {
            people: Number(m.reach),
            percent: Number(m.reach_percent),
            avgSessionDuration: m.avg_session_duration,
            trend: Number(m.trend),
            measuredAt: new Date(m.created_at).toISOString(),
          }
        : null,
      articles: a ? Number(a.n) : 0,
      paywallShare: a ? Number(a.paywall) : 0,
      topCategories: categoriesBy.get(p.key) ?? [],
      sharedStories: c ? Number(c.shared) : 0,
      bigStoriesCovered: 0,
      firstShare: c ? Number(c.first_share) : 0,
      medianLagMinutes: c && c.lag !== null && Number(c.shared) >= 20 ? Number(c.lag) : null,
      votes: {
        total,
        byRating,
        agreement: enough && side ? sideTotals[side] / total : null,
        readersSide,
      },
      similar: similarAll.slice(0, 3),
      counterpart,
      agenda: agendaBy.get(p.key) ?? null,
      limitedData: !a || Number(a.n) < 100 || !c || Number(c.shared) < 20,
    };
  });

  const bigStories: BigStory[] = bigRows.rows
    .map((r) => ({
      id: Number(r.id),
      title: r.title,
      lastArticleAt: new Date(r.last_at).toISOString(),
      outlets: r.outlets,
    }))
    .sort(
      (a, b) =>
        b.outlets.length - a.outlets.length ||
        b.lastArticleAt.localeCompare(a.lastArticleAt),
    );
  const bigCount = new Map<string, number>();
  for (const story of bigStories) {
    for (const k of story.outlets) bigCount.set(k, (bigCount.get(k) ?? 0) + 1);
  }
  for (const outlet of outlets) outlet.bigStoriesCovered = bigCount.get(outlet.key) ?? 0;

  return {
    outlets,
    bigStories,
    windowDays: LANDSCAPE_WINDOW_DAYS,
    generatedAt: new Date().toISOString(),
  };
}
