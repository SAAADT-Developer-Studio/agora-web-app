import { sql } from "drizzle-orm";
import { article, story, storyArticle } from "~/drizzle/schema";
import type { Database } from "~/lib/db";
import { SITEMAP_CHUNK_SIZE, sitemapIdBounds } from "~/lib/sitemapChunks";

export { SITEMAP_CHUNK_SIZE };

export type PublicStory = {
  id: number;
  title: string;
  lastmod: Date;
  /** Earliest of story.created_at and the first member article. */
  publishedAt: Date;
};

const NEWS_SITEMAP_LIMIT = 1000;

export type StorySitemapChunk = {
  page: number;
  lastmod: Date;
};

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function asId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function asPage(value: unknown): number | null {
  const page = typeof value === "number" ? value : Number(value);
  return Number.isInteger(page) && page >= 1 ? page : null;
}

/** One entry per sitemap file of permanent story URLs. Pages are 1-based. */
export async function listStorySitemapChunks(
  db: Database,
): Promise<StorySitemapChunk[]> {
  const size = SITEMAP_CHUNK_SIZE;
  const result = await db.execute<{ page: number; lastmod: string | Date }>(sql`
    SELECT
      ((${story.id} - 1) / ${sql.raw(String(size))}) + 1 AS page,
      max(${story.lastArticlePublishedAt}) AS lastmod
    FROM ${story}
    WHERE EXISTS (
      SELECT 1 FROM ${storyArticle}
      WHERE ${storyArticle.storyId} = ${story.id}
    )
    GROUP BY 1
    ORDER BY 1
  `);

  const chunks: StorySitemapChunk[] = [];
  for (const row of result.rows) {
    const page = asPage(row.page);
    const lastmod = asDate(row.lastmod);
    if (page == null || lastmod == null) continue;
    chunks.push({ page, lastmod });
  }
  return chunks;
}

/** Stories that have at least one article. `since` is the Google News window. */
export async function listPublicStories(
  db: Database,
  options: { since?: Date; page?: number } = {},
): Promise<PublicStory[]> {
  if (options.since) {
    const since = options.since.toISOString();
    const result = await db.execute<{
      id: number;
      title: string;
      lastmod: string | Date;
      published_at: string | Date;
    }>(sql`
      SELECT
        ${story.id} AS id,
        ${story.title} AS title,
        ${story.lastArticlePublishedAt} AS lastmod,
        LEAST(
          ${story.createdAt},
          COALESCE(min(${article.publishedAt}), ${story.createdAt})
        ) AS published_at
      FROM ${story}
      INNER JOIN ${storyArticle}
        ON ${storyArticle.storyId} = ${story.id}
      INNER JOIN ${article}
        ON ${article.id} = ${storyArticle.articleId}
      WHERE ${story.lastArticlePublishedAt} >= ${since}::timestamptz
      GROUP BY
        ${story.id},
        ${story.title},
        ${story.lastArticlePublishedAt},
        ${story.createdAt}
      HAVING LEAST(
        ${story.createdAt},
        COALESCE(min(${article.publishedAt}), ${story.createdAt})
      ) >= ${since}::timestamptz
      ORDER BY published_at DESC, ${story.id} DESC
      LIMIT ${sql.raw(String(NEWS_SITEMAP_LIMIT))}
    `);
    return rowsToStories(result.rows);
  }

  const bounds = sitemapIdBounds(options.page ?? 1);
  if (bounds == null) return [];
  const result = await db.execute<{
    id: number;
    title: string;
    lastmod: string | Date;
    published_at: string | Date;
  }>(sql`
    SELECT
      ${story.id} AS id,
      ${story.title} AS title,
      ${story.lastArticlePublishedAt} AS lastmod,
      ${story.createdAt} AS published_at
    FROM ${story}
    WHERE ${story.id} > ${bounds.minExclusive}
      AND ${story.id} <= ${bounds.maxInclusive}
      AND EXISTS (
        SELECT 1 FROM ${storyArticle}
        WHERE ${storyArticle.storyId} = ${story.id}
      )
    ORDER BY ${story.id}
  `);
  return rowsToStories(result.rows);
}

function rowsToStories(
  rows: {
    id: number;
    title: string;
    lastmod: string | Date;
    published_at: string | Date;
  }[],
): PublicStory[] {
  const stories: PublicStory[] = [];
  for (const row of rows) {
    const id = asId(row.id);
    const lastmod = asDate(row.lastmod);
    const publishedAt = asDate(row.published_at);
    const title = row.title?.trim();
    if (id == null || lastmod == null || publishedAt == null || !title) continue;
    stories.push({ id, title, lastmod, publishedAt });
  }
  return stories;
}
