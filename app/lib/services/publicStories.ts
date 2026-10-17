import { sql } from "drizzle-orm";
import { story, storyArticle } from "~/drizzle/schema";
import type { Database } from "~/lib/db";

export type PublicStory = {
  id: number;
  title: string;
  lastmod: Date;
};

const NEWS_SITEMAP_LIMIT = 1000;

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

/** Stories that have a publication time. `since` keeps the Google News window. */
export async function listPublicStories(
  db: Database,
  options: { since?: Date; limit?: number } = {},
): Promise<PublicStory[]> {
  const requestedLimit =
    options.limit ?? (options.since ? NEWS_SITEMAP_LIMIT : 50_000);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : NEWS_SITEMAP_LIMIT;
  const since = options.since?.toISOString() ?? null;

  const result = await db.execute<{
    id: number;
    title: string;
    lastmod: string | Date;
  }>(
    since
      ? sql`
          SELECT
            ${story.id} AS id,
            ${story.title} AS title,
            ${story.lastArticlePublishedAt} AS lastmod
          FROM ${story}
          WHERE ${story.lastArticlePublishedAt} >= ${since}::timestamptz
            AND EXISTS (
              SELECT 1 FROM ${storyArticle}
              WHERE ${storyArticle.storyId} = ${story.id}
            )
          ORDER BY ${story.lastArticlePublishedAt} DESC, ${story.id} DESC
          LIMIT ${sql.raw(String(limit))}
        `
      : sql`
          SELECT
            ${story.id} AS id,
            ${story.title} AS title,
            ${story.lastArticlePublishedAt} AS lastmod
          FROM ${story}
          WHERE EXISTS (
            SELECT 1 FROM ${storyArticle}
            WHERE ${storyArticle.storyId} = ${story.id}
          )
          ORDER BY ${story.lastArticlePublishedAt} DESC, ${story.id} DESC
          LIMIT ${sql.raw(String(limit))}
        `,
  );

  const stories: PublicStory[] = [];
  for (const row of result.rows) {
    const id = asId(row.id);
    const lastmod = asDate(row.lastmod);
    const title = row.title?.trim();
    if (id == null || lastmod == null || !title) continue;
    stories.push({ id, title, lastmod });
  }
  return stories;
}
