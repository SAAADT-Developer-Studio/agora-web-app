import { sql, type SQL } from "drizzle-orm";
import {
  articleCluster,
  clusterRun,
  clusterV2,
  story,
  storyArticle,
} from "~/drizzle/schema";
import {
  chooseResolvedStory,
  clusterSlugBounds,
  clusterSlugPattern,
  INT4_MAX,
  isStatementTimeout,
  isUndefinedTable,
  parseArticleParam,
  slugifyTitle,
  type ClanekResolution,
  type StoryCandidate,
} from "~/lib/articleUrl";
import type { Database } from "~/lib/db";

const STATEMENT_TIMEOUT = "1500ms";

type Queryable = Pick<Database, "execute">;

type ExactHit = { slug: string | null; storyId: number | null };

type TitleRow = { story_id: number; title: string | null; at: Date | string };

function asId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 && id <= INT4_MAX ? id : null;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/** Equality on the slug unique index, plus the dominant story, in one query. */
export function exactSlugQuery(slug: string): SQL {
  return sql`
    SELECT
      ${clusterV2.slug} AS slug,
      ${storyArticle.storyId} AS story_id
    FROM ${clusterV2}
    LEFT JOIN ${articleCluster}
      ON ${articleCluster.clusterId} = ${clusterV2.id}
    LEFT JOIN ${storyArticle}
      ON ${storyArticle.articleId} = ${articleCluster.articleId}
    WHERE ${clusterV2.slug} = ${slug}
    GROUP BY ${clusterV2.slug}, ${storyArticle.storyId}
    ORDER BY ${storyArticle.storyId} IS NULL, count(*) DESC, ${storyArticle.storyId} ASC
    LIMIT 1
  `;
}

export function exactIdQuery(id: number): SQL {
  return sql`
    SELECT
      ${clusterV2.slug} AS slug,
      ${storyArticle.storyId} AS story_id
    FROM ${clusterV2}
    LEFT JOIN ${articleCluster}
      ON ${articleCluster.clusterId} = ${clusterV2.id}
    LEFT JOIN ${storyArticle}
      ON ${storyArticle.articleId} = ${articleCluster.articleId}
    WHERE ${clusterV2.id} = ${id}
    GROUP BY ${clusterV2.slug}, ${storyArticle.storyId}
    ORDER BY ${storyArticle.storyId} IS NULL, count(*) DESC, ${storyArticle.storyId} ASC
    LIMIT 1
  `;
}

/**
 * Btree range on `cluster_v2.slug`. `last_article` is not involved.
 * The regex keeps a longer title that sorts inside the window from matching.
 */
export function nearbySlugQuery(titleSlug: string, stamp: Date): SQL {
  const bounds = clusterSlugBounds(titleSlug, stamp);
  const pattern = clusterSlugPattern(titleSlug);
  return sql`
    SELECT
      ${clusterV2.slug} AS slug,
      ${storyArticle.storyId} AS story_id,
      count(*) AS n
    FROM ${clusterV2}
    INNER JOIN ${articleCluster}
      ON ${articleCluster.clusterId} = ${clusterV2.id}
    INNER JOIN ${storyArticle}
      ON ${storyArticle.articleId} = ${articleCluster.articleId}
    WHERE ${clusterV2.slug} >= ${bounds.lower}
      AND ${clusterV2.slug} < ${bounds.upper}
      AND ${clusterV2.slug} ~ ${pattern}
    GROUP BY ${clusterV2.slug}, ${storyArticle.storyId}
  `;
}

/**
 * Story rows in the stamp window, prefiltered by the existing
 * `ix_story_last_article_published_at` index. Summaries are reached through
 * `ix_story_summary_story_id_id` (story_id), not a created_at scan of the
 * whole summary table.
 */
export function titleWindowQuery(
  start: Date,
  end: Date,
  includeSummaries: boolean,
): SQL {
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  if (!includeSummaries) {
    return sql`
      SELECT
        ${story.id} AS story_id,
        ${story.title} AS title,
        ${story.createdAt} AS at
      FROM ${story}
      WHERE ${story.lastArticlePublishedAt} >= ${startIso}::timestamptz
        AND ${story.createdAt} >= ${startIso}::timestamptz
        AND ${story.createdAt} <= ${endIso}::timestamptz
    `;
  }
  return sql`
    SELECT ss.story_id AS story_id, ss.title AS title, ss.created_at AS at
    FROM ${story} s
    INNER JOIN story_summary ss ON ss.story_id = s.id
    WHERE s.last_article_published_at >= ${startIso}::timestamptz
      AND ss.created_at >= ${startIso}::timestamptz
      AND ss.created_at <= ${endIso}::timestamptz
    UNION ALL
    SELECT
      ${story.id} AS story_id,
      ${story.title} AS title,
      ${story.createdAt} AS at
    FROM ${story}
    WHERE ${story.lastArticlePublishedAt} >= ${startIso}::timestamptz
      AND ${story.createdAt} >= ${startIso}::timestamptz
      AND ${story.createdAt} <= ${endIso}::timestamptz
      AND NOT EXISTS (
        SELECT 1 FROM story_summary ss WHERE ss.story_id = ${story.id}
      )
  `;
}

async function readExact(db: Queryable, query: SQL): Promise<ExactHit | null> {
  const result = await db.execute<{
    slug: string | null;
    story_id: number | null;
  }>(query);
  const row = result.rows[0];
  if (!row) return null;
  return { slug: row.slug, storyId: asId(row.story_id) };
}

async function runCreatedAt(db: Queryable, runId: number): Promise<Date | null> {
  const result = await db.execute<{ created_at: string | Date }>(sql`
    SELECT ${clusterRun.createdAt} AS created_at
    FROM ${clusterRun}
    WHERE ${clusterRun.id} = ${runId}
    LIMIT 1
  `);
  return asDate(result.rows[0]?.created_at);
}

async function nearbyStories(
  db: Queryable,
  titleSlug: string,
  stamp: Date,
): Promise<StoryCandidate[]> {
  const result = await db.execute<{
    slug: string;
    story_id: number;
    n: number | string;
  }>(nearbySlugQuery(titleSlug, stamp));

  const candidates: StoryCandidate[] = [];
  for (const row of result.rows) {
    const storyId = asId(row.story_id);
    const parsed = parseArticleParam(row.slug);
    const at = parsed.kind === "slug" ? parsed.runStamp : null;
    const weight = typeof row.n === "number" ? row.n : Number(row.n);
    if (storyId == null || at == null || !Number.isFinite(weight)) continue;
    candidates.push({ storyId, at, weight });
  }
  return candidates;
}

async function titleCandidates(
  db: Queryable,
  stamp: Date,
  includeSummaries: boolean,
): Promise<{ storyId: number; at: Date; slug: string }[]> {
  const bounds = clusterSlugBounds("unused", stamp);
  const result = await db.execute<TitleRow>(
    titleWindowQuery(bounds.start, bounds.end, includeSummaries),
  );
  const titles: { storyId: number; at: Date; slug: string }[] = [];
  for (const row of result.rows) {
    const storyId = asId(row.story_id);
    const at = asDate(row.at);
    const title = row.title?.trim();
    if (storyId == null || at == null || !title) continue;
    titles.push({ storyId, at, slug: slugifyTitle(title) });
  }
  return titles;
}

async function withFallbackTimeout<T>(
  db: Database,
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  return db.transaction(
    async (tx) => {
      await tx.execute(
        sql`SELECT set_config('statement_timeout', ${STATEMENT_TIMEOUT}, true)`,
      );
      return fn(tx);
    },
    { accessMode: "read only" },
  );
}

async function resolveFallback(
  db: Database,
  titleSlug: string,
  stamp: Date,
  includeSummaries: boolean,
): Promise<number | null> {
  return withFallbackTimeout(db, async (tx) => {
    const nearby = await nearbyStories(tx, titleSlug, stamp);
    const titles =
      nearby.length === 0
        ? await titleCandidates(tx, stamp, includeSummaries)
        : [];
    return chooseResolvedStory({
      directStoryId: null,
      stamp,
      titleSlug,
      nearby,
      titles,
    });
  });
}

/**
 * Resolve a `/:category/clanek/:articleId` param to a permanent story id.
 * Equality lookups stay outside a transaction. The ±3 day fallback is the
 * only place that sets a statement timeout.
 */
export async function resolveClanekToStoryId(
  db: Database,
  articleId: string,
): Promise<ClanekResolution> {
  const parsed = parseArticleParam(articleId);
  if (parsed.kind === "invalid-id") return { kind: "gone" };

  const exact =
    parsed.kind === "cluster-id"
      ? await readExact(db, exactIdQuery(parsed.id))
      : await readExact(db, exactSlugQuery(parsed.raw));
  if (exact?.storyId != null) return { kind: "story", id: exact.storyId };

  let titleSlug: string | null =
    parsed.kind === "slug" ? parsed.titleSlug : null;
  let stamp: Date | null = parsed.kind === "slug" ? parsed.runStamp : null;
  let bootstrapRunId: number | null =
    parsed.kind === "slug" ? parsed.bootstrapRunId : null;

  if (exact?.slug) {
    const fromSlug = parseArticleParam(exact.slug);
    if (fromSlug.kind === "slug") {
      titleSlug = fromSlug.titleSlug;
      stamp = fromSlug.runStamp ?? stamp;
      bootstrapRunId = fromSlug.bootstrapRunId ?? bootstrapRunId;
    }
  }

  if (stamp == null && bootstrapRunId != null) {
    stamp = await runCreatedAt(db, bootstrapRunId);
  }
  if (stamp == null || !titleSlug) return { kind: "gone" };

  try {
    const storyId = await resolveFallback(db, titleSlug, stamp, true);
    return storyId == null ? { kind: "gone" } : { kind: "story", id: storyId };
  } catch (error) {
    if (isStatementTimeout(error)) return { kind: "unavailable" };
    if (!isUndefinedTable(error)) throw error;
  }

  // The first transaction is already rolled back. Retry without story_summary.
  try {
    const storyId = await resolveFallback(db, titleSlug, stamp, false);
    return storyId == null ? { kind: "gone" } : { kind: "story", id: storyId };
  } catch (error) {
    if (isStatementTimeout(error)) return { kind: "unavailable" };
    throw error;
  }
}

/** Dominant story for each cluster, for listing cards. One indexed query. */
export async function dominantStoryIds(
  db: Pick<Database, "execute">,
  clusterIds: number[],
): Promise<Map<number, number>> {
  const ids = [
    ...new Set(
      clusterIds.filter(
        (id) => Number.isInteger(id) && id > 0 && id <= INT4_MAX,
      ),
    ),
  ];
  if (ids.length === 0) return new Map();

  const result = await db.execute<{ cluster_id: number; story_id: number }>(sql`
    SELECT DISTINCT ON (cluster_id) cluster_id, story_id
    FROM (
      SELECT
        ${articleCluster.clusterId} AS cluster_id,
        ${storyArticle.storyId} AS story_id,
        count(*) AS n
      FROM ${articleCluster}
      INNER JOIN ${storyArticle}
        ON ${storyArticle.articleId} = ${articleCluster.articleId}
      WHERE ${articleCluster.clusterId} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `,
      )})
      GROUP BY 1, 2
    ) counted
    ORDER BY cluster_id, n DESC, story_id ASC
  `);

  const stories = new Map<number, number>();
  for (const row of result.rows) {
    const clusterId = asId(row.cluster_id);
    const storyId = asId(row.story_id);
    if (clusterId != null && storyId != null) stories.set(clusterId, storyId);
  }
  return stories;
}
