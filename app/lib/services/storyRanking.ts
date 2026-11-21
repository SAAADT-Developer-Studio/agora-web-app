import type { Database } from "~/lib/db";
import {
  article,
  articleSocialPost,
  newsProvider,
  story,
  storyArticle,
} from "~/drizzle/schema";
import { sql, type SQL } from "drizzle-orm";
import {
  STORY_RANK_MAX_AGE,
  compareCoalescedRank,
  freshStoryRankingRunSql,
  observedRankFailureLabel,
} from "~/lib/storyRankOrder";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import {
  extractCarouselImages,
  extractHeroImage,
} from "~/utils/extractHeroImage";
import { config, defineCategoryMap, type CategoryKeyValue } from "~/config";
import {
  biasCountColumns,
  blindspotFilter,
  emptyArticlesByCategory,
  newestPublishedAt,
  type ArticleType,
} from "~/lib/services/ranking";
import { BLINDSPOTS_PER_SIDE, type BlindspotSide } from "~/utils/blindspots";

const CATEGORY_PRIORITY = defineCategoryMap({
  politika: 6,
  gospodarstvo: 6,
  kriminal: 5,
  lokalno: 5,
  "tehnologija-znanost": 4,
  sport: 2,
  kultura: 2,
  zdravje: 1,
  okolje: 1,
});

const MAX_CATEGORY_PRIORITY = Math.max(...Object.values(CATEGORY_PRIORITY));

const categoryPriorityCases = sql.join(
  (Object.entries(CATEGORY_PRIORITY) as [CategoryKeyValue, number][]).map(
    ([key, priority]) => sql`WHEN ${key} THEN ${priority}`,
  ),
  sql.raw(" "),
);

// Decay constant: articles lose ~63% relevance every 12 hours
// Formula: exp(-hours_since_publication / 12)
const RECENCY_DECAY_HOURS = 12;

const recencyScoreExpr = sql<number>`
  max(
    exp(
      -extract(epoch from (now() - ${article.publishedAt}::timestamptz)) / 3600 / ${RECENCY_DECAY_HOURS}
    )
  )
`;

// Category score: average priority of first category across articles, normalized by max priority
const categoryScoreExpr = sql<number>`
  avg(
    CASE ${article.categories}[1]
      ${categoryPriorityCases}
      ELSE 0
    END
  ) / ${MAX_CATEGORY_PRIORITY}
`;

/**
 * Stories aren't run-scoped; this window bounds the listing candidates.
 * Outside it a story page is an archive, like a clanek from an older run.
 */
export const STORY_WINDOW_DAYS = 14;

export const recentStoriesFilter = sql`${story.lastArticlePublishedAt} > now() - make_interval(days => ${STORY_WINDOW_DAYS})`;

/**
 * Merged stories are redirects. The ranking job does not score them
 * (`merged_into_story_id IS NULL`). Memberships are cleared on merge, so the
 * article join already drops them; this keeps a story hidden if memberships remain.
 * `story.hidden` is not referenced: agora #112 has not merged, so the column is
 * not on main.
 */
const notMergedStory = sql`${story}."merged_into_story_id" IS NULL`;

type SelectedStory = {
  id: number;
  combined_score: number;
  lastArticlePublishedAt: Date | string | null;
};

function publishedAtValue(value: unknown): Date | string | null {
  if (value == null) return null;
  if (value instanceof Date || typeof value === "string") return value;
  return null;
}

function selectedStories(
  rows: ReadonlyArray<{
    id?: unknown;
    combined_score?: unknown;
    last_article_published_at?: unknown;
  }>,
  tieBreak: boolean,
): SelectedStory[] {
  return rows.map((row) => {
    const score =
      row.combined_score == null
        ? tieBreak
          ? Number.NEGATIVE_INFINITY
          : 0
        : Number(row.combined_score);
    return {
      id: Number(row.id),
      combined_score: Number.isFinite(score) ? score : 0,
      lastArticlePublishedAt: tieBreak
        ? publishedAtValue(row.last_article_published_at)
        : null,
    };
  });
}

/**
 * One home or category render. A failed ranking lookup is logged once, then
 * every later section in the same render uses the formula without querying again.
 */
export type ObservedRankSession = {
  failed: boolean;
  warned: boolean;
};

export function createObservedRankSession(): ObservedRankSession {
  return { failed: false, warned: false };
}

function noteObservedRankFailure(
  session: ObservedRankSession | undefined,
  error: unknown,
) {
  if (session) {
    const alreadyWarned = session.warned;
    session.failed = true;
    session.warned = true;
    if (alreadyWarned) return;
  }
  console.warn(
    `STORY_RANK_ORDER lookup failed (${observedRankFailureLabel(error)}); using the current story ordering.`,
  );
}

/**
 * Id of the latest fresh succeeded `source = 'story'` run, or undefined when
 * the flag is off, no such run exists, or the lookup errors. Callers then
 * keep the in-app formula. Any error (missing relation, permission denied,
 * timeout, or anything else) is logged once per session and does not throw.
 */
export async function resolveObservedStoryRankRun(
  db: Database,
  enabled: boolean,
  session?: ObservedRankSession,
): Promise<number | undefined> {
  if (!enabled || session?.failed) return undefined;
  try {
    const result = await db.execute(freshStoryRankingRunSql());
    const id = result.rows[0]?.id;
    const runId =
      typeof id === "number"
        ? id
        : typeof id === "string" && /^[0-9]+$/.test(id)
          ? Number(id)
          : null;
    if (runId == null) {
      console.warn(
        `STORY_RANK_ORDER is true but no succeeded source='story' ranking_run finished within the last ${STORY_RANK_MAX_AGE}; using the current story ordering.`,
      );
      return undefined;
    }
    return runId;
  } catch (error) {
    noteObservedRankFailure(session, error);
    return undefined;
  }
}

/** Omitted on the first page so the home listing SQL stays unchanged. */
function pageOffset(offset: number | undefined) {
  if (!offset) return sql``;
  return sql`OFFSET ${offset}`;
}

/**
 * Same candidate set as the in-app home formula, ordered by `story_rank.score`
 * from one ranking run. Stories that run did not score (created after it, or
 * skipped) keep the formula score via COALESCE. Category membership is not
 * applied here.
 *
 * `story_rank_pkey` is `(ranking_run_id, story_id)`, so the left join is a
 * primary-key lookup per candidate. The 14-day aggregate is the same work the
 * formula already does.
 */
export function observedStoryHomeSql({
  count,
  side,
  observedRunId,
  offset,
}: {
  count: number;
  side?: BlindspotSide;
  observedRunId: number;
  /** Skip this many stories. Omit or 0 to keep the first page. */
  offset?: number;
}): SQL {
  return sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
      AND ${notMergedStory}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      ${categoryScoreExpr} as category_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles,
      ${biasCountColumns}
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN ${newsProvider} ON ${article.newsProviderKey} = ${newsProvider.key}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
      AND ${notMergedStory}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      category_score,
      social_post_count,
      max_provider_articles,
      rated_count,
      left_count,
      right_count,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    normalized_scores.id as id,
    COALESCE(story_rank.score, (
      (cluster_llm_rank_score * 0.4 + recency_score * 0.20 + category_score * 0.20 + social_score * 0.20)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    )) as combined_score,
    ${story.lastArticlePublishedAt} as last_article_published_at
  FROM normalized_scores
  JOIN ${story} ON ${story.id} = normalized_scores.id
  LEFT JOIN story_rank
    ON story_rank.story_id = normalized_scores.id
   AND story_rank.ranking_run_id = ${observedRunId}
  ${blindspotFilter(side)}
  ORDER BY combined_score DESC NULLS LAST,
           ${story.lastArticlePublishedAt} DESC,
           ${story.id} DESC
  LIMIT ${count}
  ${pageOffset(offset)}
`;
}

/**
 * Category pages keep the listing's membership rule (an article's first or
 * second category), not `story_rank.rank_category`. That column is one
 * casefolded publisher vote and can be null, so filtering on it would change
 * which stories appear.
 */
export function observedStoryCategorySql({
  ignoredClusterIds,
  category,
  count,
  offset,
  observedRunId,
}: {
  ignoredClusterIds: number[];
  category: CategoryKeyValue;
  count: number;
  offset?: number;
  observedRunId: number;
}): SQL {
  return sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
      AND ${notMergedStory}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
      AND ${notMergedStory}
      AND (${category} = ANY(ARRAY[${article.categories}[1], ${article.categories}[2]]))
      ${ignoredClusterIds.length > 0 ? sql`AND ${story.id} NOT IN ${ignoredClusterIds}` : sql``}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      social_post_count,
      max_provider_articles,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    normalized_scores.id as id,
    COALESCE(story_rank.score, (
      (cluster_llm_rank_score * 0.45 + recency_score * 0.3 + social_score * 0.25)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    )) as combined_score,
    ${story.lastArticlePublishedAt} as last_article_published_at
  FROM normalized_scores
  JOIN ${story} ON ${story.id} = normalized_scores.id
  LEFT JOIN story_rank
    ON story_rank.story_id = normalized_scores.id
   AND story_rank.ranking_run_id = ${observedRunId}
  ORDER BY combined_score DESC NULLS LAST,
           ${story.lastArticlePublishedAt} DESC,
           ${story.id} DESC
  LIMIT ${count}
  OFFSET ${offset ?? 0}
`;
}

async function selectObserved(
  db: Database,
  query: SQL,
  session?: ObservedRankSession,
): Promise<SelectedStory[] | undefined> {
  if (session?.failed) return undefined;
  try {
    const result = await db.execute(query);
    return selectedStories(result.rows, true);
  } catch (error) {
    noteObservedRankFailure(session, error);
    return undefined;
  }
}

export async function getStoryHomeArticles({
  db,
  count,
  side,
  offset = 0,
  observedRunId,
  rankSession,
}: {
  db: Database;
  count: number;
  /** Only this side's blindspots, still in ranking order. */
  side?: BlindspotSide;
  /**
   * Skip this many stories after ranking. Existing callers omit it, which
   * keeps the first page and the same SQL.
   */
  offset?: number;
  /** Fresh succeeded story ranking run. Omit to keep the in-app formula. */
  observedRunId?: number;
  /** Shared with the other sections of this render so a failure is logged once. */
  rankSession?: ObservedRankSession;
}): Promise<ArticleType[]> {
  if (observedRunId != null && !rankSession?.failed) {
    const ranked = await selectObserved(
      db,
      observedStoryHomeSql({ count, side, observedRunId, offset }),
      rankSession,
    );
    if (ranked) return await hydrateStories(db, ranked, true);
  }
  const topStoryIds = await db.execute(sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      ${categoryScoreExpr} as category_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles,
      ${biasCountColumns}
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN ${newsProvider} ON ${article.newsProviderKey} = ${newsProvider.key}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      category_score,
      social_post_count,
      max_provider_articles,
      rated_count,
      left_count,
      right_count,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    id,
    article_count,
    cluster_llm_rank_score,
    recency_score,
    category_score,
    social_score,

    (max_provider_articles::float / NULLIF(article_count, 0)) as dominance,
    (cluster_llm_rank_score * 0.4 + recency_score * 0.20 + category_score * 0.20 + social_score * 0.20) as base_score,
    (
      (cluster_llm_rank_score * 0.4 + recency_score * 0.20 + category_score * 0.20 + social_score * 0.20)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    ) as combined_score
  FROM normalized_scores
  ${blindspotFilter(side)}
  ORDER BY combined_score DESC
  LIMIT ${count}
  ${pageOffset(offset)}
`);
  return await hydrateStories(
    db,
    selectedStories(topStoryIds.rows, false),
    false,
  );
}

export async function getStoryCategoryArticles({
  db,
  ignoredClusterIds,
  category,
  count,
  offset,
  observedRunId,
  rankSession,
}: {
  db: Database;
  ignoredClusterIds: number[];
  category: CategoryKeyValue;
  count: number;
  offset?: number;
  /** Fresh succeeded story ranking run. Omit to keep the in-app formula. */
  observedRunId?: number;
  /** Shared with the other sections of this render so a failure is logged once. */
  rankSession?: ObservedRankSession;
}): Promise<ArticleType[]> {
  if (observedRunId != null && !rankSession?.failed) {
    const ranked = await selectObserved(
      db,
      observedStoryCategorySql({
        ignoredClusterIds,
        category,
        count,
        offset,
        observedRunId,
      }),
      rankSession,
    );
    if (ranked) return await hydrateStories(db, ranked, true);
  }
  const topStoryIds = await db.execute(sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
      AND (${category} = ANY(ARRAY[${article.categories}[1], ${article.categories}[2]]))
      ${ignoredClusterIds.length > 0 ? sql`AND ${story.id} NOT IN ${ignoredClusterIds}` : sql``}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      social_post_count,
      max_provider_articles,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    id,
    article_count,
    cluster_llm_rank_score,
    recency_score,
    social_score,

    (max_provider_articles::float / NULLIF(article_count, 0)) as dominance,

    (cluster_llm_rank_score * 0.45 + recency_score * 0.3 + social_score * 0.25) as base_score,

    (
      (cluster_llm_rank_score * 0.45 + recency_score * 0.3 + social_score * 0.25)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    ) as combined_score
  FROM normalized_scores
  ORDER BY combined_score DESC
  LIMIT ${count}
  OFFSET ${offset ?? 0}
`);

  return await hydrateStories(
    db,
    selectedStories(topStoryIds.rows, false),
    false,
  );
}

async function hydrateStories(
  db: Database,
  storyIds: SelectedStory[],
  tieBreak: boolean,
): Promise<ArticleType[]> {
  if (storyIds.length === 0) return [];

  const topStories = await db.query.story.findMany({
    where: (s, { inArray }) =>
      inArray(
        s.id,
        storyIds.map((row) => row.id),
      ),
    with: {
      storyArticles: {
        with: {
          article_articleId: {
            columns: {
              id: true,
              imageUrls: true,
              categories: true,
              publishedAt: true,
            },
            with: { newsProvider: true },
          },
        },
      },
    },
  });

  topStories.sort((a, b) => {
    const aRow = storyIds.find((row) => row.id === a.id);
    const bRow = storyIds.find((row) => row.id === b.id);
    if (!tieBreak)
      return (bRow?.combined_score ?? 0) - (aRow?.combined_score ?? 0);
    return compareCoalescedRank(
      {
        id: a.id,
        score: aRow?.combined_score ?? 0,
        lastArticlePublishedAt: aRow?.lastArticlePublishedAt ?? null,
      },
      {
        id: b.id,
        score: bRow?.combined_score ?? 0,
        lastArticlePublishedAt: bRow?.lastArticlePublishedAt ?? null,
      },
    );
  });

  return topStories.map((s) => {
    const storyArticles = s.storyArticles.map((sa) => sa.article_articleId);
    const tags = new Set(
      storyArticles
        .map((a) => a.categories)
        .filter((c) => c !== null)
        .flat(),
    );
    const providerKeys = new Set(storyArticles.map((a) => a.newsProvider.key));
    const tagList = Array.from(tags).slice(0, 3);

    return {
      id: s.id.toString(),
      title: s.title,
      image: {
        src: extractHeroImage(storyArticles),
        alt: "Placeholder Image 1", // TODO: fix this or get rid of it
      },
      tags: tagList.length > 0 ? tagList : ["politika"],
      biasDistribution: getBiasDistribution(storyArticles),
      showTags: true,
      numberOfArticles: storyArticles.length,
      providerKeys: Array.from(providerKeys),
      to: `/zgodba/${s.id}`,
      images: extractCarouselImages(storyArticles),
      lastPublishedAt: newestPublishedAt(storyArticles),
    };
  });
}

/** Home feed (`/`): hero stories, per-category sections, and blindspots. */
export async function fetchHomeArticlesData({
  db,
  storyRankOrder = false,
  rankSession,
}: {
  db: Database;
  /** When true, order by the latest fresh story ranking run. */
  storyRankOrder?: boolean;
  /** Reuse across the home feed and category pages of one populate-cache call. */
  rankSession?: ObservedRankSession;
}) {
  const session = rankSession ?? createObservedRankSession();
  const observedRunId = await resolveObservedStoryRankRun(
    db,
    storyRankOrder,
    session,
  );
  const homeArticles = await getStoryHomeArticles({
    db,
    count: 6,
    observedRunId,
    rankSession: session,
  });
  let ignoredClusterIds = homeArticles.map((a) => Number(a.id));

  const byCategory = emptyArticlesByCategory();

  for (const category of config.categories) {
    const categoryArticles = await getStoryCategoryArticles({
      db,
      ignoredClusterIds,
      count: 6,
      category: category.key,
      observedRunId,
      rankSession: session,
    });

    ignoredClusterIds = [
      ...ignoredClusterIds,
      ...categoryArticles.map((a) => Number(a.id)),
    ];

    byCategory[category.key] = categoryArticles;
  }

  return {
    home: homeArticles,
    ...byCategory,
    // Searched across the whole window: one-sided stories rarely rank high.
    // A hero story can repeat here — the section answers a different question.
    blindspots: {
      left: await getStoryHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "left",
        observedRunId,
        rankSession: session,
      }),
      right: await getStoryHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "right",
        observedRunId,
        rankSession: session,
      }),
    },
  };
}
