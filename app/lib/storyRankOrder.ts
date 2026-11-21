import { sql, type SQL } from "drizzle-orm";

/** Wrangler var. The feed reads `story_rank` only when this is the string `true`. */
export const STORY_RANK_ORDER_VAR = "STORY_RANK_ORDER";

/** `ranking_run.source` value written by agora's story ranking job. */
export const STORY_RANKING_SOURCE = "story";

export const STORY_RANKING_SUCCEEDED = "succeeded";

/**
 * Ignore a succeeded story run older than this and keep the in-app ordering.
 *
 * `agora-ranking.timer` fires at :00 and :30 UTC, and each worker is capped
 * at 25 minutes, so a healthy `finished_at` is less than an hour old. Two
 * hours covers one missed slot plus that cap. Scores are a snapshot taken
 * at `evaluated_at`; they do not decay after the run finishes.
 */
export const STORY_RANK_MAX_AGE = "2 hours";

export function storyRankOrderEnabled(
  value: string | undefined | null,
): boolean {
  return value === "true";
}

export function storyRankOrderFromEnv(env: object): boolean {
  if (!(STORY_RANK_ORDER_VAR in env)) return false;
  const value = (env as Record<string, unknown>)[STORY_RANK_ORDER_VAR];
  return storyRankOrderEnabled(typeof value === "string" ? value : undefined);
}

/**
 * Latest succeeded story ranking run that is still fresh.
 *
 * `ranking_run` is the run log (cluster runs are kept; story runs are dropped
 * after the job's 14-day retention). This is a `LIMIT 1` filter, not a scan
 * of `story_rank`, so it does not need a new index.
 */
export function freshStoryRankingRunSql(): SQL {
  return sql`
    SELECT id
    FROM ranking_run
    WHERE source = ${STORY_RANKING_SOURCE}
      AND status = ${STORY_RANKING_SUCCEEDED}
      AND finished_at >= now() - interval '${sql.raw(STORY_RANK_MAX_AGE)}'
    ORDER BY finished_at DESC, id DESC
    LIMIT 1
  `;
}

export type CoalescedRank = {
  id: number;
  /**
   * `story_rank.score` when the fresh run scored this story, otherwise the
   * in-app formula. Both are higher-is-better values in [0, 1], but they are
   * not on the same scale.
   */
  score: number;
  lastArticlePublishedAt: Date | string | null;
};

function publishedAtMs(value: Date | string | null): number {
  if (value == null || value === "") return Number.NEGATIVE_INFINITY;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

/**
 * Same order as the observed-rank SQL:
 * coalesced score descending, then newer `last_article_published_at`, then higher id.
 */
export function compareCoalescedRank(
  a: CoalescedRank,
  b: CoalescedRank,
): number {
  if (a.score !== b.score) return b.score - a.score;
  const byTime =
    publishedAtMs(b.lastArticlePublishedAt) -
    publishedAtMs(a.lastArticlePublishedAt);
  if (byTime !== 0) return byTime;
  return b.id - a.id;
}

/**
 * Short label for a failed `ranking_run` / `story_rank` read.
 * Every such error falls back to the formula; this is only for the log line.
 */
export function observedRankFailureLabel(error: unknown): string {
  const code = pgErrorCode(error);
  const message = error instanceof Error ? error.message : "unknown error";
  const detail = message.replace(/\s+/g, " ").slice(0, 200);
  return code ? `${code} ${detail}` : detail;
}

function pgErrorCode(error: unknown, depth = 0): string | undefined {
  if (depth > 5 || error == null || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return code;
  return pgErrorCode((error as { cause?: unknown }).cause, depth + 1);
}
