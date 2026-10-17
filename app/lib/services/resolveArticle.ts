import { sql } from "drizzle-orm";
import { articleCluster, clusterV2, storyArticle } from "~/drizzle/schema";
import {
  chooseResolvedStory,
  clusterSlugBounds,
  clusterSlugPattern,
  clusterTitleSlug,
  INT4_MAX,
  isUndefinedTable,
  parseArticleParam,
  rethrowUnlessTimeout,
  slugifyTitle,
  type ParsedArticleParam,
  type StoryCandidate,
} from "~/lib/articleUrl";
import type { Database } from "~/lib/db";

const STATEMENT_TIMEOUT = "1500ms";

type Queryable = Pick<Database, "execute">;

type ClusterRef = { id: number; slug: string | null };

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

async function findClusterById(
  db: Queryable,
  id: number,
): Promise<ClusterRef | null> {
  const result = await db.execute<{ id: number; slug: string | null }>(sql`
    SELECT ${clusterV2.id} AS id, ${clusterV2.slug} AS slug
    FROM ${clusterV2}
    WHERE ${clusterV2.id} = ${id}
    LIMIT 1
  `);
  const row = result.rows[0];
  return row ? { id: row.id, slug: row.slug } : null;
}

async function findClusterBySlug(
  db: Queryable,
  slug: string,
): Promise<ClusterRef | null> {
  const result = await db.execute<{ id: number; slug: string | null }>(sql`
    SELECT ${clusterV2.id} AS id, ${clusterV2.slug} AS slug
    FROM ${clusterV2}
    WHERE ${clusterV2.slug} = ${slug}
    LIMIT 1
  `);
  const row = result.rows[0];
  return row ? { id: row.id, slug: row.slug } : null;
}

/** Story that owns the most member articles of this cluster. Lowest id wins ties. */
async function dominantStoryId(
  db: Queryable,
  clusterId: number,
): Promise<number | null> {
  const result = await db.execute<{ story_id: number }>(sql`
    SELECT ${storyArticle.storyId} AS story_id
    FROM ${articleCluster}
    INNER JOIN ${storyArticle}
      ON ${storyArticle.articleId} = ${articleCluster.articleId}
    WHERE ${articleCluster.clusterId} = ${clusterId}
    GROUP BY ${storyArticle.storyId}
    ORDER BY count(*) DESC, ${storyArticle.storyId} ASC
    LIMIT 1
  `);
  return asId(result.rows[0]?.story_id);
}

/**
 * One index range scan: clusters with this title slug whose run stamp is
 * within ±3 days, joined to the story that owns each cluster.
 */
async function nearbyStories(
  db: Queryable,
  titleSlug: string,
  stamp: Date,
): Promise<StoryCandidate[]> {
  const bounds = clusterSlugBounds(titleSlug, stamp);
  const pattern = clusterSlugPattern(titleSlug);
  const result = await db.execute<{
    slug: string;
    story_id: number;
    n: number | string;
  }>(sql`
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
  `);

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

async function readTitleRows(
  db: Queryable,
  start: Date,
  end: Date,
  includeSummaries: boolean,
): Promise<TitleRow[]> {
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  if (!includeSummaries) {
    const result = await db.execute<TitleRow>(sql`
      SELECT
        id AS story_id,
        title,
        created_at AS at
      FROM story
      WHERE created_at >= ${startIso}::timestamptz
        AND created_at <= ${endIso}::timestamptz
    `);
    return result.rows;
  }

  const result = await db.execute<TitleRow>(sql`
    SELECT story_id, title, created_at AS at
    FROM story_summary
    WHERE created_at >= ${startIso}::timestamptz
      AND created_at <= ${endIso}::timestamptz
    UNION ALL
    SELECT s.id AS story_id, s.title, s.created_at AS at
    FROM story s
    WHERE s.created_at >= ${startIso}::timestamptz
      AND s.created_at <= ${endIso}::timestamptz
      AND NOT EXISTS (
        SELECT 1 FROM story_summary ss WHERE ss.story_id = s.id
      )
  `);
  return result.rows;
}

/**
 * Titles that were current near the run stamp.
 * Historical `story_summary` rows keep headlines after `story.title` is overwritten.
 * Stories that never received a summary still match on their original title.
 */
async function titleCandidates(
  db: Queryable,
  stamp: Date,
): Promise<{ storyId: number; at: Date; slug: string }[]> {
  const bounds = clusterSlugBounds("unused", stamp);
  let rows: TitleRow[];
  try {
    rows = await readTitleRows(db, bounds.start, bounds.end, true);
  } catch (error) {
    if (!isUndefinedTable(error)) throw error;
    rows = await readTitleRows(db, bounds.start, bounds.end, false);
  }

  const titles: { storyId: number; at: Date; slug: string }[] = [];
  for (const row of rows) {
    const storyId = asId(row.story_id);
    const at = asDate(row.at);
    const title = row.title?.trim();
    if (storyId == null || at == null || !title) continue;
    titles.push({ storyId, at, slug: slugifyTitle(title) });
  }
  return titles;
}

async function resolveInTransaction(
  db: Queryable,
  parsed: ParsedArticleParam,
): Promise<number | null> {
  if (parsed.kind === "invalid-id") return null;

  let cluster: ClusterRef | null = null;
  let titleSlug: string | null = null;
  let stamp: Date | null = null;

  if (parsed.kind === "cluster-id") {
    cluster = await findClusterById(db, parsed.id);
    if (cluster?.slug) {
      const fromSlug = parseArticleParam(cluster.slug);
      if (fromSlug.kind === "slug") {
        titleSlug = fromSlug.titleSlug;
        stamp = fromSlug.runStamp;
      } else {
        titleSlug = clusterTitleSlug(cluster.slug);
      }
    }
  } else {
    titleSlug = parsed.titleSlug;
    stamp = parsed.runStamp;
    cluster = await findClusterBySlug(db, parsed.raw);
  }

  const direct =
    cluster == null ? null : await dominantStoryId(db, cluster.id);

  // No run stamp: equality lookup only. A prefix scan cannot use the slug index.
  if (stamp == null || !titleSlug) return direct;

  const nearby = direct == null ? await nearbyStories(db, titleSlug, stamp) : [];
  const titles =
    direct == null && nearby.length === 0
      ? await titleCandidates(db, stamp)
      : [];

  return chooseResolvedStory({
    directStoryId: direct,
    stamp,
    titleSlug,
    nearby,
    titles,
  });
}

/**
 * Resolve a `/:category/clanek/:articleId` param to a permanent story id.
 * Category is irrelevant. Returns null when no story can be resolved, including
 * when a query hits the statement timeout.
 */
export async function resolveClanekToStoryId(
  db: Database,
  articleId: string,
): Promise<number | null> {
  const parsed = parseArticleParam(articleId);
  if (parsed.kind === "invalid-id") return null;

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SET TRANSACTION READ ONLY`);
      await tx.execute(
        sql`SET LOCAL statement_timeout = ${sql.raw(`'${STATEMENT_TIMEOUT}'`)}`,
      );
      return resolveInTransaction(tx, parsed);
    });
  } catch (error) {
    return rethrowUnlessTimeout(error);
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
