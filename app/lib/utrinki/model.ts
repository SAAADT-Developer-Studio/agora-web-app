import { getCategory, isCategoryKey, type CategoryKeyValue } from "~/config";
import { biasSide } from "~/utils/biasSide";
import { getCarouselArticleIds } from "~/utils/getCarouselArticleIds";
import { resolvePlural } from "~/utils/resolvePlural";
import { parseStoryBullets } from "~/utils/storySummary";
import {
  biasCountsAddUp,
  biasPercents,
  countBiasSides,
  type BiasCounts,
} from "~/lib/utrinki/bias";

export const UTRINKI_PAGE_SIZE = 10;
export const UTRINKI_PAGE_CAP = 50;

export type UtrinkiCategory = "aktualno" | CategoryKeyValue;

export type UtrinkiArticle = {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  providerKey: string;
  providerName: string;
  biasRating: string | null;
  side: ReturnType<typeof biasSide>;
};

export type UtrinkiProvider = { key: string; name: string };

export type UtrinkiBias = BiasCounts & {
  leftPercent: number;
  centerPercent: number;
  rightPercent: number;
};

export type UtrinkiStory = {
  id: number;
  title: string;
  summary: string;
  category: CategoryKeyValue | null;
  categoryLabel: string;
  updatedAt: string;
  imageUrl: string | null;
  /** Hero candidates in carousel order; the reel shows the largest that loads. */
  imageCandidates: string[];
  articleCount: number;
  providerCount: number;
  providers: UtrinkiProvider[];
  bias: UtrinkiBias;
  articles: UtrinkiArticle[];
  coverageLabel: string;
  spanLabel: string;
  storyPath: `/zgodba/${number}`;
};

export type UtrinkiPage = {
  stories: UtrinkiStory[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  category: UtrinkiCategory;
  /** Dev-only fixture flag. Omitted on cached production pages. */
  draft?: boolean;
  /** Story the reel opens on (`?zgodba=`); it is first in `stories`. */
  focus?: number;
};

export type UtrinkiMember = {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  summary: string | null;
  imageUrls: string[] | null;
  categories: string[] | null;
  newsProvider: {
    key: string;
    name: string;
    biasRating: string | null;
    rank: number;
  };
};

const TIME_ZONE = "Europe/Ljubljana";
const dayFormat = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  day: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  month: "short",
});
const yearFormat = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  year: "numeric",
});

function cleanTitle(title: string) {
  return title.replaceAll("&quot;", '"').replaceAll("&amp;", "&").trim();
}

function stamp(parts: Intl.DateTimeFormat, date: Date) {
  return parts.format(date).replaceAll("\u00a0", " ").replace(/\.$/, "");
}

/** "18.–24. avg." when the month matches, otherwise both dates. */
export function formatCoverageSpan(oldestIso: string, newestIso: string) {
  const oldest = new Date(oldestIso);
  const newest = new Date(newestIso);
  const sameDay =
    stamp(dayFormat, oldest) === stamp(dayFormat, newest) &&
    stamp(monthFormat, oldest) === stamp(monthFormat, newest) &&
    stamp(yearFormat, oldest) === stamp(yearFormat, newest);
  if (sameDay) {
    return `${stamp(dayFormat, oldest)}. ${stamp(monthFormat, oldest)}`;
  }
  const sameMonth =
    stamp(monthFormat, oldest) === stamp(monthFormat, newest) &&
    stamp(yearFormat, oldest) === stamp(yearFormat, newest);
  if (sameMonth) {
    return `${stamp(dayFormat, oldest)}.–${stamp(dayFormat, newest)}. ${stamp(monthFormat, newest)}`;
  }
  return `${stamp(dayFormat, oldest)}. ${stamp(monthFormat, oldest)} – ${stamp(dayFormat, newest)}. ${stamp(monthFormat, newest)}`;
}

export function coverageLabel(articleCount: number, providerCount: number) {
  const articles = resolvePlural({
    count: articleCount,
    singular: "članek",
    dual: "članka",
    plural: "člankov",
  });
  const sources = resolvePlural({
    count: providerCount,
    singular: "vir",
    dual: "vira",
    plural: "virov",
  });
  return `${articleCount} ${articles} · ${providerCount} ${sources}`;
}

/** Compact kicker clock, rendered on the device so a cached page stays honest. */
export function updatedKicker(updatedAt: string, now = Date.now()) {
  const mins = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 60000));
  if (!Number.isFinite(mins)) return "POSODOBLJENO";
  if (mins < 60) return `POSODOBLJENO PRED ${Math.max(mins, 1)} MIN`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `POSODOBLJENO PRED ${hours} H`;
  return `POSODOBLJENO PRED ${Math.floor(hours / 24)} D`;
}

/** Sheet row clock, matching the frame: "pred 3 h". */
export function shortAgo(iso: string, now = Date.now()) {
  const mins = Math.floor((now - Date.parse(iso)) / 60000);
  if (!Number.isFinite(mins)) return "pred kratkim";
  if (mins < 60) return `pred ${Math.max(mins, 1)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `pred ${hours} h`;
  return `pred ${Math.floor(hours / 24)} d`;
}

export function parseUtrinkiQuery(searchParams: URLSearchParams): {
  category: UtrinkiCategory;
  page: number;
} {
  const rawCategory = searchParams.get("kategorija");
  const category =
    rawCategory && isCategoryKey(rawCategory) ? rawCategory : "aktualno";
  const pageRaw = Number(searchParams.get("stran"));
  const page =
    Number.isInteger(pageRaw) && pageRaw > 0
      ? Math.min(pageRaw, UTRINKI_PAGE_CAP)
      : 0;
  return { category, page };
}

/** `?zgodba=123`: open the reel on that story. */
export function parseUtrinkiFocus(searchParams: URLSearchParams) {
  const id = Number(searchParams.get("zgodba"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Reel link that opens on one story, e.g. from the home page row. */
export function utrinkiStoryHref(storyId: number) {
  return `/utrinki?zgodba=${storyId}`;
}

/** Puts the focused story first, fetching it when the page lacks it. */
export async function withFocusedStory(
  page: UtrinkiPage,
  focus: number,
  load: (id: number) => Promise<UtrinkiStory | null>,
): Promise<UtrinkiPage> {
  const rest = page.stories.filter((story) => story.id !== focus);
  const found =
    page.stories.find((story) => story.id === focus) ?? (await load(focus));
  if (!found) return page;
  return { ...page, stories: [found, ...rest], focus };
}

export function utrinkiWindow(page: number) {
  const safe =
    Number.isFinite(page) && page > 0
      ? Math.min(Math.floor(page), UTRINKI_PAGE_CAP)
      : 0;
  return {
    page: safe,
    offset: safe * UTRINKI_PAGE_SIZE,
    limit: UTRINKI_PAGE_SIZE + 1,
  };
}

export function utrinkiCategoryHref(category: UtrinkiCategory, draft = false) {
  return utrinkiPageHref(category, 0, draft);
}

export function utrinkiPageHref(
  category: UtrinkiCategory,
  page: number,
  draft = false,
) {
  const params = new URLSearchParams();
  if (category !== "aktualno") params.set("kategorija", category);
  if (page > 0) params.set("stran", String(page));
  if (draft) params.set("osnutek", "1");
  const query = params.toString();
  return query ? `/utrinki?${query}` : "/utrinki";
}

/** JSON continuation of a page. Kept off the document loader so a failure stays on the reel. */
export function utrinkiDataHref(
  category: UtrinkiCategory,
  page: number,
  draft = false,
) {
  const href = utrinkiPageHref(category, page, draft);
  return href.replace("/utrinki", "/api/utrinki");
}

export function isUtrinkiPage(value: unknown): value is UtrinkiPage {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Partial<UtrinkiPage>;
  return (
    Array.isArray(page.stories) &&
    typeof page.page === "number" &&
    typeof page.hasMore === "boolean" &&
    (page.category === "aktualno" ||
      (typeof page.category === "string" && isCategoryKey(page.category)))
  );
}

/** Drop stories already on the reel so a later page cannot reuse a React key. */
export function appendUniqueStories(
  pages: readonly (readonly UtrinkiStory[])[],
  incoming: readonly UtrinkiStory[],
): UtrinkiStory[][] {
  const seen = new Set<number>();
  for (const chunk of pages) {
    for (const story of chunk) seen.add(story.id);
  }
  const next = incoming.filter((story) => {
    if (seen.has(story.id)) return false;
    seen.add(story.id);
    return true;
  });
  if (next.length === 0) return pages as UtrinkiStory[][];
  return [...pages.map((chunk) => [...chunk]), next];
}

function dominantCategory(members: readonly UtrinkiMember[]) {
  const counts = new Map<CategoryKeyValue, number>();
  for (const member of members) {
    const key = member.categories?.[0];
    if (key && isCategoryKey(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: CategoryKeyValue | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

const HERO_CANDIDATES = 4;

function heroImages(members: readonly UtrinkiMember[]) {
  const ids = getCarouselArticleIds(
    members.map((member) => ({
      id: member.id,
      imageUrls: member.imageUrls,
      newsProvider: {
        rank: member.newsProvider.rank,
        biasRating: member.newsProvider.biasRating,
      },
    })),
  );
  const byId = new Map(members.map((member) => [member.id, member]));
  const urls: string[] = [];
  for (const id of ids) {
    const url = byId.get(id)?.imageUrls?.[0];
    if (!url || url.toLowerCase().endsWith(".mp4") || urls.includes(url)) {
      continue;
    }
    urls.push(url);
    if (urls.length === HERO_CANDIDATES) break;
  }
  return urls;
}

export type StoryHook = { text: string; tone: "left" | "right" | "neutral" };

/**
 * One line that gives a reason to open the story: who is (not) covering it.
 * Built only from outlet ratings, so it never claims more than the data says.
 */
export function storyHook(
  bias: Pick<UtrinkiBias, "left" | "center" | "right">,
  providerCount: number,
): StoryHook | null {
  const rated = bias.left + bias.center + bias.right;
  if (providerCount < 2 || rated < 2) return null;
  if (bias.left > 0 && bias.right === 0) {
    return { text: "Desno usmerjeni mediji o tem ne poročajo", tone: "left" };
  }
  if (bias.right > 0 && bias.left === 0) {
    return { text: "Levo usmerjeni mediji o tem ne poročajo", tone: "right" };
  }
  if (bias.left === 0 && bias.right === 0) {
    return { text: "Poročajo le sredinski mediji", tone: "neutral" };
  }
  return { text: "Poročajo levi in desni mediji", tone: "neutral" };
}

export function toUtrinkiStory(input: {
  id: number;
  title: string;
  summaryTitle?: string | null;
  lastArticlePublishedAt: string;
  bullets: unknown;
  members: UtrinkiMember[];
}): UtrinkiStory | null {
  if (input.members.length === 0) return null;

  const articles = input.members
    .slice()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .map((member) => ({
      id: member.id,
      title: cleanTitle(member.title),
      url: member.url,
      publishedAt: new Date(member.publishedAt).toISOString(),
      providerKey: member.newsProvider.key,
      providerName: member.newsProvider.name,
      biasRating: member.newsProvider.biasRating,
      side: biasSide(member.newsProvider.biasRating),
    }));

  const providers: UtrinkiProvider[] = [];
  const seenProviders = new Set<string>();
  for (const article of articles) {
    if (seenProviders.has(article.providerKey)) continue;
    seenProviders.add(article.providerKey);
    providers.push({ key: article.providerKey, name: article.providerName });
  }

  const counts = countBiasSides(articles.map((article) => article.biasRating));
  const percents = biasPercents(counts);
  const category = dominantCategory(input.members);
  const images = heroImages(input.members);
  const times = articles.map((article) => Date.parse(article.publishedAt));
  const bullets = parseStoryBullets(
    input.bullets,
    new Set(input.members.map((member) => member.id)),
  );

  const bias: UtrinkiBias = {
    ...counts,
    leftPercent: percents.left,
    centerPercent: percents.center,
    rightPercent: percents.right,
  };

  if (!biasCountsAddUp(bias)) {
    console.error("Utrinki bias counts do not add up", bias);
  }

  return {
    id: input.id,
    title: cleanTitle(input.summaryTitle?.trim() || input.title),
    summary: bullets[0]?.text ?? "",
    category,
    categoryLabel: category ? getCategory(category).name : "AKTUALNO",
    updatedAt: new Date(input.lastArticlePublishedAt).toISOString(),
    imageUrl: images[0] ?? null,
    imageCandidates: images,
    articleCount: articles.length,
    providerCount: providers.length,
    providers,
    bias,
    articles,
    coverageLabel: coverageLabel(articles.length, providers.length),
    spanLabel: formatCoverageSpan(
      new Date(Math.min(...times)).toISOString(),
      new Date(Math.max(...times)).toISOString(),
    ),
    storyPath: `/zgodba/${input.id}`,
  };
}

export function assembleUtrinkiPage(input: {
  rankedIds: readonly number[];
  stories: readonly UtrinkiStory[];
  page: number;
  category: UtrinkiCategory;
}): UtrinkiPage {
  const byId = new Map(input.stories.map((story) => [story.id, story]));
  const hasMore = input.rankedIds.length > UTRINKI_PAGE_SIZE;
  const stories = input.rankedIds.slice(0, UTRINKI_PAGE_SIZE).flatMap((id) => {
    const story = byId.get(id);
    return story ? [story] : [];
  });
  return {
    stories,
    hasMore,
    page: input.page,
    pageSize: UTRINKI_PAGE_SIZE,
    category: input.category,
  };
}
