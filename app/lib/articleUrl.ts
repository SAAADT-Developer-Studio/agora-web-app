/**
 * Public article URLs.
 *
 * Clustering runs mint a new `cluster_v2.slug` about every 10 minutes:
 * `{slugify(title)}-{YYYY-MM-DD-HH-MM}-{index}`. That slug is not stable.
 * The permanent URL is `/zgodba/{story.id}`.
 */

/** Postgres `integer` / int4 upper bound. Larger values must not be queried. */
export const INT4_MAX = 2_147_483_647;

/** How far a run stamp may sit from the cluster or story it resolves to. */
export const MATCH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const LEGACY_RUN_SUFFIX =
  /^(?<titleSlug>.+)-(?<stamp>\d{4}-\d{2}-\d{2}-\d{2}-\d{2})-(?<index>\d+)$/;

export type ParsedArticleParam =
  | { kind: "cluster-id"; id: number; raw: string }
  | { kind: "invalid-id"; raw: string }
  | {
      kind: "slug";
      titleSlug: string;
      raw: string;
      /**
       * Set when the param ends in a real clustering-run stamp.
       * Title fallbacks run only in that case.
       */
      runStamp: Date | null;
    };

export type StoryCandidate = {
  storyId: number;
  at: Date;
  weight?: number;
};

/**
 * Positive int4, or null. Leading zeros are accepted (`007` → 7).
 * Values above 2147483647 are rejected so Postgres is never asked to cast them.
 */
export function parseInt4Id(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const normalized = raw.replace(/^0+/, "") || "0";
  if (normalized.length > 10) return null;
  const id = Number(normalized);
  if (!Number.isInteger(id) || id < 1 || id > INT4_MAX) return null;
  return id;
}

/** Parse `YYYY-MM-DD-HH-MM` as UTC. Invalid calendar dates return null. */
export function parseRunStamp(stamp: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(stamp);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) {
    return null;
  }
  return date;
}

function padStamp(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatRunStamp(date: Date): string {
  return [
    date.getUTCFullYear(),
    padStamp(date.getUTCMonth() + 1),
    padStamp(date.getUTCDate()),
    padStamp(date.getUTCHours()),
    padStamp(date.getUTCMinutes()),
  ].join("-");
}

/**
 * Classify a `clanek` param.
 *
 * Only an all-digit param inside int4 is a legacy cluster id. `parseInt`
 * would treat `18-tisoc-...` and `2026-10-17-...` as integers and look up
 * the wrong row, and `99999999999` overflows int4 into a 500.
 */
export function parseArticleParam(articleId: string): ParsedArticleParam {
  if (/^\d+$/.test(articleId)) {
    const id = parseInt4Id(articleId);
    if (id == null) return { kind: "invalid-id", raw: articleId };
    return { kind: "cluster-id", id, raw: articleId };
  }

  const legacy = LEGACY_RUN_SUFFIX.exec(articleId);
  if (legacy?.groups?.titleSlug && legacy.groups.stamp) {
    return {
      kind: "slug",
      titleSlug: legacy.groups.titleSlug,
      raw: articleId,
      runStamp: parseRunStamp(legacy.groups.stamp),
    };
  }

  return { kind: "slug", titleSlug: articleId, raw: articleId, runStamp: null };
}

/** Title portion of a `cluster_v2.slug`, without the run timestamp and index. */
export function clusterTitleSlug(slug: string): string {
  const parsed = parseArticleParam(slug);
  return parsed.kind === "slug" ? parsed.titleSlug : slug;
}

/**
 * Inclusive btree bounds for slugs of `titleSlug` whose run stamp is within
 * ±3 days. `lower <= slug < upper` can use the unique `cluster_v2.slug` index.
 * The upper bound is the minute after the window so every index at the end
 * minute is included.
 */
export function clusterSlugBounds(
  titleSlug: string,
  stamp: Date,
  windowMs = MATCH_WINDOW_MS,
): { lower: string; upper: string; start: Date; end: Date } {
  const start = new Date(stamp.getTime() - windowMs);
  const end = new Date(stamp.getTime() + windowMs);
  const upperMinute = new Date(end.getTime() + 60_000);
  return {
    lower: `${titleSlug}-${formatRunStamp(start)}`,
    upper: `${titleSlug}-${formatRunStamp(upperMinute)}`,
    start,
    end,
  };
}

/** POSIX regex that matches only this title plus a run suffix. */
export function clusterSlugPattern(titleSlug: string): string {
  const escaped = titleSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^${escaped}-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]+$`;
}

/**
 * Same algorithm as `scraper/app/utils/slugify.py`:
 * NFKD, drop non-ASCII (so `đ` is removed, not rewritten to `d`),
 * collapse non-alphanumerics to `-`, trim, lowercase.
 * That function does not truncate.
 */
export function slugifyTitle(text: string): string {
  let ascii = "";
  for (const char of text.normalize("NFKD")) {
    const code = char.codePointAt(0);
    if (code != null && code <= 0x7f) ascii += char;
  }
  return ascii
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function storyPath(storyId: number): string {
  return `/zgodba/${storyId}`;
}

export type StoryParam =
  | { type: "not-found" }
  | { type: "redirect"; id: number }
  | { type: "load"; id: number };

/** `/zgodba/:storyId` before any query. Overflow and junk are 404s. */
export function classifyStoryParam(raw: string | undefined): StoryParam {
  if (!raw || !/^\d+$/.test(raw)) return { type: "not-found" };
  const id = parseInt4Id(raw);
  if (id == null) return { type: "not-found" };
  if (raw !== String(id)) return { type: "redirect", id };
  return { type: "load", id };
}

/** A story row with no articles is gone (410). A missing row is a 404. */
export function persistedStoryStatus(articleCount: number): 200 | 410 {
  return articleCount > 0 ? 200 : 410;
}

/**
 * Closest candidate to the URL stamp, inside the window.
 * Higher weight wins ties, then the lower story id. Outside the window
 * the candidate is ignored so a newer recurring headline cannot win.
 */
export function pickClosestStory(
  candidates: StoryCandidate[],
  stamp: Date,
  windowMs = MATCH_WINDOW_MS,
): number | null {
  let best: { storyId: number; dist: number; weight: number } | null = null;
  for (const candidate of candidates) {
    const at = candidate.at.getTime();
    if (!Number.isFinite(at)) continue;
    const dist = Math.abs(at - stamp.getTime());
    if (dist > windowMs) continue;
    const weight = candidate.weight ?? 0;
    if (
      best == null ||
      dist < best.dist ||
      (dist === best.dist && weight > best.weight) ||
      (dist === best.dist &&
        weight === best.weight &&
        candidate.storyId < best.storyId)
    ) {
      best = { storyId: candidate.storyId, dist, weight };
    }
  }
  return best?.storyId ?? null;
}

export function chooseResolvedStory(input: {
  directStoryId: number | null;
  stamp: Date | null;
  titleSlug: string | null;
  nearby: StoryCandidate[];
  titles: { storyId: number; at: Date; slug: string }[];
}): number | null {
  if (input.directStoryId != null) return input.directStoryId;
  if (input.stamp == null || !input.titleSlug) return null;
  const fromClusters = pickClosestStory(input.nearby, input.stamp);
  if (fromClusters != null) return fromClusters;
  const titled = input.titles
    .filter((row) => row.slug === input.titleSlug)
    .map((row) => ({ storyId: row.storyId, at: row.at }));
  return pickClosestStory(titled, input.stamp);
}

export function isStatementTimeout(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    if (record.code === "57014") return true;
    if (
      typeof record.message === "string" &&
      record.message.toLowerCase().includes("statement timeout")
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}

/** Timeouts become "unresolved" (HTTP 410). Every other error propagates. */
export function rethrowUnlessTimeout(error: unknown): null {
  if (isStatementTimeout(error)) return null;
  throw error;
}

export function isUndefinedTable(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    if (record.code === "42P01") return true;
    const message = record.message;
    if (
      typeof message === "string" &&
      message.includes("does not exist") &&
      message.includes("story_summary")
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}
