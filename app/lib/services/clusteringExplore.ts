import { desc, eq, sql } from "drizzle-orm";
import type { Database } from "~/lib/db";
import {
  article,
  articleCluster,
  clusterRun,
  clusterV2,
  newsProvider,
  story,
  storyArticle,
} from "~/drizzle/schema";
import { isCategoryKey } from "~/config";
import { href } from "react-router";

export type RunInfo = {
  id: number;
  createdAt: string;
  algoVersion: string;
};

export type StoryFreshness = {
  lastAssignedAt: string | null;
  lastCreatedAt: string | null;
};

export type ArticleRow = {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  categories: string[] | null;
  newsProviderKey: string;
  providerName: string;
};

export type StoryRow = {
  id: number;
  title: string;
  lastArticlePublishedAt: string;
  createdAt: string;
  method: string | null;
  similarity: number | null;
  nearestArticleId: number | null;
};

export type ClusterRow = {
  id: number;
  title: string;
  slug: string | null;
  runId: number;
  createdAt: string;
};

export type MemberRow = ArticleRow & {
  method: string | null;
  similarity: number | null;
  nearestArticleId: number | null;
  storyId: number | null;
  storyTitle: string | null;
  clusterId: number | null;
  clusterTitle: string | null;
  clusterSlug: string | null;
  vsStorySimilarity: number | null;
  vsStoryNearestArticleId: number | null;
};

export type SplitStory = {
  id: number;
  title: string;
  clusterCount: number;
  articleCount: number;
};

export type SplitCluster = {
  id: number;
  title: string;
  slug: string | null;
  storyCount: number;
  articleCount: number;
};

export function clanekPath(
  categories: string[] | null,
  slugOrId: string | number,
) {
  const cat = categories?.[0]?.toLowerCase();
  if (!cat || !isCategoryKey(cat)) return null;
  return href("/:category/clanek/:articleId", {
    category: cat,
    articleId: String(slugOrId),
  });
}

export async function latestProductionRun(
  db: Database,
): Promise<RunInfo | null> {
  const [run] = await db
    .select({
      id: clusterRun.id,
      createdAt: clusterRun.createdAt,
      algoVersion: clusterRun.algoVersion,
    })
    .from(clusterRun)
    .where(eq(clusterRun.isProduction, true))
    .orderBy(desc(clusterRun.createdAt))
    .limit(1);
  return run ?? null;
}

export async function latestStoryFreshness(
  db: Database,
): Promise<StoryFreshness> {
  const rows = await db.execute<{
    last_assigned_at: string | null;
    last_created_at: string | null;
  }>(sql`
    SELECT
      (SELECT max(${storyArticle.assignedAt}) FROM ${storyArticle}) AS last_assigned_at,
      (SELECT max(${story.createdAt}) FROM ${story}) AS last_created_at
  `);
  return {
    lastAssignedAt: rows.rows[0]?.last_assigned_at ?? null,
    lastCreatedAt: rows.rows[0]?.last_created_at ?? null,
  };
}

export async function embeddingDim(db: Database): Promise<number | null> {
  const rows = await db.execute<{ dim: number | null }>(sql`
    SELECT array_length(${article.embedding}, 1) AS dim
    FROM ${article}
    LIMIT 1
  `);
  return rows.rows[0]?.dim ?? null;
}

function mapArticle(row: {
  id: number;
  title: string;
  url: string;
  published_at: string;
  categories: string[] | null;
  news_provider_key: string;
  provider_name: string;
}): ArticleRow {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    publishedAt: row.published_at,
    categories: row.categories,
    newsProviderKey: row.news_provider_key,
    providerName: row.provider_name,
  };
}

export async function findArticle(
  db: Database,
  q: string,
): Promise<ArticleRow | null> {
  const byId = /^\d+$/.test(q);
  const url = byId ? q : q.replace(/\/+$/, "");
  const rows = await db.execute<{
    id: number;
    title: string;
    url: string;
    published_at: string;
    categories: string[] | null;
    news_provider_key: string;
    provider_name: string;
  }>(sql`
    SELECT
      ${article.id} AS id,
      ${article.title} AS title,
      ${article.url} AS url,
      ${article.publishedAt} AS published_at,
      ${article.categories} AS categories,
      ${article.newsProviderKey} AS news_provider_key,
      ${newsProvider.name} AS provider_name
    FROM ${article}
    INNER JOIN ${newsProvider}
      ON ${newsProvider.key} = ${article.newsProviderKey}
    WHERE ${byId ? sql`${article.id} = ${Number(q)}` : sql`${article.url} = ${url}`}
    LIMIT 1
  `);
  const row = rows.rows[0];
  return row ? mapArticle(row) : null;
}

export async function searchArticleTitles(
  db: Database,
  q: string,
): Promise<ArticleRow[]> {
  const needle = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  // ponytail: 14d window so we hit ix_article_published_at_* instead of a title seq scan
  const rows = await db.execute<{
    id: number;
    title: string;
    url: string;
    published_at: string;
    categories: string[] | null;
    news_provider_key: string;
    provider_name: string;
  }>(sql`
    SELECT
      ${article.id} AS id,
      ${article.title} AS title,
      ${article.url} AS url,
      ${article.publishedAt} AS published_at,
      ${article.categories} AS categories,
      ${article.newsProviderKey} AS news_provider_key,
      ${newsProvider.name} AS provider_name
    FROM ${article}
    INNER JOIN ${newsProvider}
      ON ${newsProvider.key} = ${article.newsProviderKey}
    WHERE ${article.publishedAt} > now() - interval '14 days'
      AND ${article.title} ILIKE ${needle}
    ORDER BY ${article.publishedAt} DESC
    LIMIT 25
  `);
  return rows.rows.map(mapArticle);
}

export async function storyForArticle(
  db: Database,
  articleId: number,
): Promise<StoryRow | null> {
  const rows = await db.execute<{
    id: number;
    title: string;
    last_article_published_at: string;
    created_at: string;
    method: string;
    similarity: number | null;
    nearest_article_id: number | null;
  }>(sql`
    SELECT
      ${story.id} AS id,
      ${story.title} AS title,
      ${story.lastArticlePublishedAt} AS last_article_published_at,
      ${story.createdAt} AS created_at,
      ${storyArticle.method} AS method,
      ${storyArticle.similarity} AS similarity,
      ${storyArticle.nearestArticleId} AS nearest_article_id
    FROM ${storyArticle}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${storyArticle.articleId} = ${articleId}
    LIMIT 1
  `);
  const row = rows.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    lastArticlePublishedAt: row.last_article_published_at,
    createdAt: row.created_at,
    method: row.method,
    similarity: row.similarity,
    nearestArticleId: row.nearest_article_id,
  };
}

export async function clusterForArticle(
  db: Database,
  articleId: number,
  runId: number,
): Promise<ClusterRow | null> {
  const rows = await db.execute<{
    id: number;
    title: string;
    slug: string | null;
    run_id: number;
    created_at: string;
  }>(sql`
    SELECT
      ${clusterV2.id} AS id,
      ${clusterV2.title} AS title,
      ${clusterV2.slug} AS slug,
      ${clusterV2.runId} AS run_id,
      ${clusterV2.createdAt} AS created_at
    FROM ${articleCluster}
    INNER JOIN ${clusterV2} ON ${clusterV2.id} = ${articleCluster.clusterId}
    WHERE ${articleCluster.articleId} = ${articleId}
      AND ${articleCluster.runId} = ${runId}
    LIMIT 1
  `);
  const row = rows.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    runId: row.run_id,
    createdAt: row.created_at,
  };
}

export async function findStory(
  db: Database,
  id: number,
): Promise<StoryRow | null> {
  const [row] = await db
    .select({
      id: story.id,
      title: story.title,
      lastArticlePublishedAt: story.lastArticlePublishedAt,
      createdAt: story.createdAt,
    })
    .from(story)
    .where(eq(story.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row, method: null, similarity: null, nearestArticleId: null };
}

export async function findCluster(
  db: Database,
  idOrSlug: string,
): Promise<ClusterRow | null> {
  const byId = /^\d+$/.test(idOrSlug);
  const rows = await db.execute<{
    id: number;
    title: string;
    slug: string | null;
    run_id: number;
    created_at: string;
  }>(
    byId
      ? sql`
        SELECT
          ${clusterV2.id} AS id,
          ${clusterV2.title} AS title,
          ${clusterV2.slug} AS slug,
          ${clusterV2.runId} AS run_id,
          ${clusterV2.createdAt} AS created_at
        FROM ${clusterV2}
        WHERE ${clusterV2.id} = ${Number(idOrSlug)}
        LIMIT 1
      `
      : sql`
        SELECT
          ${clusterV2.id} AS id,
          ${clusterV2.title} AS title,
          ${clusterV2.slug} AS slug,
          ${clusterV2.runId} AS run_id,
          ${clusterV2.createdAt} AS created_at
        FROM ${clusterV2}
        WHERE ${clusterV2.slug} = ${idOrSlug}
        LIMIT 1
      `,
  );
  const row = rows.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    runId: row.run_id,
    createdAt: row.created_at,
  };
}

const memberSelect = sql`
  ${article.id} AS id,
  ${article.title} AS title,
  ${article.url} AS url,
  ${article.publishedAt} AS published_at,
  ${article.categories} AS categories,
  ${article.newsProviderKey} AS news_provider_key,
  ${newsProvider.name} AS provider_name,
  ${storyArticle.method} AS method,
  ${storyArticle.similarity} AS similarity,
  ${storyArticle.nearestArticleId} AS nearest_article_id,
  ${story.id} AS story_id,
  ${story.title} AS story_title,
  ${clusterV2.id} AS cluster_id,
  ${clusterV2.title} AS cluster_title,
  ${clusterV2.slug} AS cluster_slug
`;

type MemberSql = {
  id: number;
  title: string;
  url: string;
  published_at: string;
  categories: string[] | null;
  news_provider_key: string;
  provider_name: string;
  method: string | null;
  similarity: number | null;
  nearest_article_id: number | null;
  story_id: number | null;
  story_title: string | null;
  cluster_id: number | null;
  cluster_title: string | null;
  cluster_slug: string | null;
};

function mapMember(row: MemberSql): MemberRow {
  return {
    ...mapArticle(row),
    method: row.method,
    similarity: row.similarity,
    nearestArticleId: row.nearest_article_id,
    storyId: row.story_id,
    storyTitle: row.story_title,
    clusterId: row.cluster_id,
    clusterTitle: row.cluster_title,
    clusterSlug: row.cluster_slug,
    vsStorySimilarity: null,
    vsStoryNearestArticleId: null,
  };
}

export async function storyMembers(
  db: Database,
  storyId: number,
  runId: number,
): Promise<MemberRow[]> {
  const rows = await db.execute<MemberSql>(sql`
    SELECT ${memberSelect}
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${article.id} = ${storyArticle.articleId}
    INNER JOIN ${newsProvider} ON ${newsProvider.key} = ${article.newsProviderKey}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    LEFT JOIN ${articleCluster}
      ON ${articleCluster.articleId} = ${article.id}
      AND ${articleCluster.runId} = ${runId}
    LEFT JOIN ${clusterV2} ON ${clusterV2.id} = ${articleCluster.clusterId}
    WHERE ${storyArticle.storyId} = ${storyId}
    ORDER BY ${article.publishedAt} DESC
  `);
  return rows.rows.map(mapMember);
}

export async function clusterMembers(
  db: Database,
  clusterId: number,
  runId: number,
): Promise<MemberRow[]> {
  const rows = await db.execute<MemberSql>(sql`
    SELECT ${memberSelect}
    FROM ${articleCluster}
    INNER JOIN ${article} ON ${article.id} = ${articleCluster.articleId}
    INNER JOIN ${newsProvider} ON ${newsProvider.key} = ${article.newsProviderKey}
    LEFT JOIN ${storyArticle} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    LEFT JOIN ${clusterV2} ON ${clusterV2.id} = ${articleCluster.clusterId}
    WHERE ${articleCluster.clusterId} = ${clusterId}
      AND ${articleCluster.runId} = ${runId}
    ORDER BY ${article.publishedAt} DESC
  `);
  return rows.rows.map(mapMember);
}

export async function nearestStorySims(
  db: Database,
  storyId: number,
  articleIds: number[],
): Promise<Map<number, { similarity: number; nearestArticleId: number }>> {
  if (articleIds.length === 0) return new Map();
  const rows = await db.execute<{
    article_id: number;
    nearest_article_id: number;
    similarity: number;
  }>(sql`
    WITH cand AS (
      SELECT ${article.id} AS id, ${article.embedding} AS embedding
      FROM ${article}
      WHERE ${article.id} IN (${sql.join(
        articleIds.map((id) => sql`${id}`),
        sql`, `,
      )})
    ),
    members AS (
      SELECT ${article.id} AS id, ${article.embedding} AS embedding
      FROM ${storyArticle}
      INNER JOIN ${article} ON ${article.id} = ${storyArticle.articleId}
      WHERE ${storyArticle.storyId} = ${storyId}
    )
    SELECT DISTINCT ON (cand.id)
      cand.id AS article_id,
      members.id AS nearest_article_id,
      (
        (SELECT SUM(x * y) FROM unnest(cand.embedding, members.embedding) AS t(x, y))
        / NULLIF(
          sqrt((SELECT SUM(x * x) FROM unnest(cand.embedding) AS x))
            * sqrt((SELECT SUM(y * y) FROM unnest(members.embedding) AS y)),
          0
        )
      ) AS similarity
    FROM cand
    CROSS JOIN members
    ORDER BY cand.id, similarity DESC NULLS LAST
  `);
  return new Map(
    rows.rows
      .filter((row) => row.similarity != null)
      .map((row) => [
        row.article_id,
        {
          similarity: row.similarity,
          nearestArticleId: row.nearest_article_id,
        },
      ]),
  );
}

export async function splitStories(
  db: Database,
  runId: number,
): Promise<SplitStory[]> {
  const rows = await db.execute<{
    id: number;
    title: string;
    cluster_count: number;
    article_count: number;
  }>(sql`
    SELECT
      ${story.id} AS id,
      ${story.title} AS title,
      count(DISTINCT ${articleCluster.clusterId})::int AS cluster_count,
      count(${storyArticle.articleId})::int AS article_count
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${storyArticle.storyId} = ${story.id}
    LEFT JOIN ${articleCluster}
      ON ${articleCluster.articleId} = ${storyArticle.articleId}
      AND ${articleCluster.runId} = ${runId}
    WHERE ${story.lastArticlePublishedAt} > now() - interval '14 days'
    GROUP BY ${story.id}
    HAVING count(DISTINCT ${articleCluster.clusterId}) > 1
    ORDER BY cluster_count DESC, article_count DESC
    LIMIT 40
  `);
  return rows.rows.map((row) => ({
    id: row.id,
    title: row.title,
    clusterCount: row.cluster_count,
    articleCount: row.article_count,
  }));
}

export async function splitClusters(
  db: Database,
  runId: number,
): Promise<SplitCluster[]> {
  const rows = await db.execute<{
    id: number;
    title: string;
    slug: string | null;
    story_count: number;
    article_count: number;
  }>(sql`
    SELECT
      ${clusterV2.id} AS id,
      ${clusterV2.title} AS title,
      ${clusterV2.slug} AS slug,
      count(DISTINCT ${storyArticle.storyId})::int AS story_count,
      count(${articleCluster.articleId})::int AS article_count
    FROM ${clusterV2}
    INNER JOIN ${articleCluster} ON ${articleCluster.clusterId} = ${clusterV2.id}
    LEFT JOIN ${storyArticle} ON ${storyArticle.articleId} = ${articleCluster.articleId}
    WHERE ${clusterV2.runId} = ${runId}
    GROUP BY ${clusterV2.id}
    HAVING count(DISTINCT ${storyArticle.storyId}) > 1
    ORDER BY story_count DESC, article_count DESC
    LIMIT 40
  `);
  return rows.rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    storyCount: row.story_count,
    articleCount: row.article_count,
  }));
}

export async function unmatchedCounts(db: Database, runId: number) {
  const noStory = await db.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n
    FROM ${articleCluster}
    WHERE ${articleCluster.runId} = ${runId}
      AND NOT EXISTS (
        SELECT 1 FROM ${storyArticle}
        WHERE ${storyArticle.articleId} = ${articleCluster.articleId}
      )
  `);
  const noCluster = await db.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n
    FROM ${storyArticle}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${story.lastArticlePublishedAt} > now() - interval '14 days'
      AND NOT EXISTS (
        SELECT 1 FROM ${articleCluster}
        WHERE ${articleCluster.articleId} = ${storyArticle.articleId}
          AND ${articleCluster.runId} = ${runId}
      )
  `);
  return {
    clusterArticlesWithoutStory: noStory.rows[0]?.n ?? 0,
    recentStoryArticlesWithoutCluster: noCluster.rows[0]?.n ?? 0,
  };
}
