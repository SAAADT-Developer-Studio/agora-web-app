import { sql } from "drizzle-orm";
import {
  articleCluster,
  clusterV2,
  story,
  storyArticle,
} from "~/drizzle/schema";
import type { Database } from "~/lib/db";
import { clusterTitleSlug, parseArticleParam } from "~/lib/articleUrl";

const RUN_SUFFIX_PATTERN =
  "-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]+$";

type ClusterRef = { id: number; slug: string | null };

function asId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function likePrefix(titleSlug: string) {
  return `${titleSlug.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}-%`;
}

async function findClusterById(
  db: Database,
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
  db: Database,
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

async function findNewestClusterByTitleSlug(
  db: Database,
  titleSlug: string,
): Promise<ClusterRef | null> {
  const result = await db.execute<{ id: number; slug: string | null }>(sql`
    SELECT ${clusterV2.id} AS id, ${clusterV2.slug} AS slug
    FROM ${clusterV2}
    WHERE ${clusterV2.slug} LIKE ${likePrefix(titleSlug)} ESCAPE '\\'
      AND regexp_replace(${clusterV2.slug}, ${RUN_SUFFIX_PATTERN}, '') = ${titleSlug}
    ORDER BY ${clusterV2.createdAt} DESC, ${clusterV2.id} DESC
    LIMIT 1
  `);
  const row = result.rows[0];
  return row ? { id: row.id, slug: row.slug } : null;
}

/** Story that owns the most member articles of this cluster. Lowest id wins ties. */
async function dominantStoryId(
  db: Database,
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
 * Newest cluster with this title slug that is already linked to a story.
 * Used when the URL's own cluster row is gone or has no story membership.
 */
async function newestMappedStoryId(
  db: Database,
  titleSlug: string,
): Promise<number | null> {
  const result = await db.execute<{ story_id: number }>(sql`
    WITH matches AS (
      SELECT ${clusterV2.id} AS id, ${clusterV2.createdAt} AS created_at
      FROM ${clusterV2}
      WHERE ${clusterV2.slug} LIKE ${likePrefix(titleSlug)} ESCAPE '\\'
        AND regexp_replace(${clusterV2.slug}, ${RUN_SUFFIX_PATTERN}, '') = ${titleSlug}
      ORDER BY ${clusterV2.createdAt} DESC, ${clusterV2.id} DESC
      LIMIT 20
    ),
    counts AS (
      SELECT
        matches.created_at,
        matches.id AS cluster_id,
        ${storyArticle.storyId} AS story_id,
        count(*) AS n
      FROM matches
      INNER JOIN ${articleCluster}
        ON ${articleCluster.clusterId} = matches.id
      INNER JOIN ${storyArticle}
        ON ${storyArticle.articleId} = ${articleCluster.articleId}
      GROUP BY matches.created_at, matches.id, ${storyArticle.storyId}
    )
    SELECT story_id
    FROM counts
    ORDER BY created_at DESC, cluster_id DESC, n DESC, story_id ASC
    LIMIT 1
  `);
  return asId(result.rows[0]?.story_id);
}

async function storyIdByTitleSlug(
  db: Database,
  titleSlug: string,
): Promise<number | null> {
  try {
    const result = await db.execute<{ id: number }>(sql`
      SELECT ${story.id} AS id
      FROM ${story}
      WHERE lower(trim(both '-' from regexp_replace(
        regexp_replace(normalize(${story.title}, ${sql.raw("NFKD")}), '[^[:ascii:]]', '', 'g'),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      ))) = ${titleSlug}
      ORDER BY ${story.lastArticlePublishedAt} DESC, ${story.id} DESC
      LIMIT 1
    `);
    return asId(result.rows[0]?.id);
  } catch (error) {
    console.error("Story title slug lookup failed:", error);
    return null;
  }
}

/**
 * Resolve a `/:category/clanek/:articleId` param to a permanent story id.
 * Category is irrelevant: the same slug under any prefix is one story.
 * Returns null only when no story can be resolved at all.
 */
export async function resolveClanekToStoryId(
  db: Database,
  articleId: string,
): Promise<number | null> {
  const parsed = parseArticleParam(articleId);

  let cluster: ClusterRef | null = null;
  let titleSlug: string | null = null;

  if (parsed.kind === "cluster-id") {
    cluster = await findClusterById(db, parsed.id);
    titleSlug = cluster?.slug ? clusterTitleSlug(cluster.slug) : null;
  } else {
    titleSlug = parsed.titleSlug;
    cluster = await findClusterBySlug(db, parsed.raw);
    if (!cluster) {
      cluster = await findNewestClusterByTitleSlug(db, parsed.titleSlug);
    }
    if (cluster?.slug) {
      titleSlug = clusterTitleSlug(cluster.slug);
    }
  }

  if (cluster) {
    const direct = await dominantStoryId(db, cluster.id);
    if (direct != null) return direct;
  }

  if (titleSlug) {
    const newest = await newestMappedStoryId(db, titleSlug);
    if (newest != null) return newest;
    return storyIdByTitleSlug(db, titleSlug);
  }

  return null;
}
