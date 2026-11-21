import { article, newsProvider } from "~/drizzle/schema";
import { sql } from "drizzle-orm";
import { BiasRatingKey } from "~/enums/biasRatingKey";
import {
  BLINDSPOT_MIN_PERCENT,
  BLINDSPOT_MIN_RATED,
  type BlindspotSide,
} from "~/utils/blindspots";
import {
  CategoryKey,
  type CategoryKeyValue,
  type CategoryMap,
} from "~/config";

export type Image = {
  src: string;
  alt: string;
};

export type BiasDistribution = {
  leftPercent: number;
  centerPercent: number;
  rightPercent: number;
  leftCount: number;
  centerCount: number;
  rightCount: number;
  totalCount: number;
};

export type ArticleType = {
  id: string;
  slug?: string;
  title: string;
  image: Image;
  tags: string[];
  biasDistribution: BiasDistribution;
  showTags?: boolean;
  numberOfArticles: number;
  providerKeys: string[];
  /** Story URL (`/zgodba/:id`). Absent only in KV entries from the cluster_v2 listings, which link to clanek. */
  to?: string;
  /** Lead images for the hero carousel, `image.src` first. Absent in older KV entries. */
  images?: string[];
  /** ISO time of the newest member article. Absent in KV entries cached before it existed. */
  lastPublishedAt?: string;
};

/** ISO time of the newest article, or undefined when none carry a date. */
export function newestPublishedAt(articles: { publishedAt: string | null }[]) {
  let newest: string | undefined;
  for (const { publishedAt } of articles) {
    if (
      publishedAt &&
      (!newest || Date.parse(publishedAt) > Date.parse(newest))
    )
      newest = publishedAt;
  }
  return newest && new Date(newest).toISOString();
}

export type ArticlesByCategory = CategoryMap<ArticleType[]>;

export function emptyArticlesByCategory(): ArticlesByCategory {
  return Object.fromEntries(
    (Object.values(CategoryKey) as CategoryKeyValue[]).map((key) => [
      key,
      [] as ArticleType[],
    ]),
  ) as ArticlesByCategory;
}

/**
 * Per-story rated / left / right article counts for the ranking queries.
 * DISTINCT because the social-post and provider joins fan rows out.
 */
export const biasCountColumns = sql`
  count(DISTINCT ${article.id}) FILTER (WHERE ${newsProvider.biasRating} IS NOT NULL) as rated_count,
  count(DISTINCT ${article.id}) FILTER (
    WHERE ${newsProvider.biasRating} IN (${BiasRatingKey.Left}, ${BiasRatingKey.CenterLeft})
  ) as left_count,
  count(DISTINCT ${article.id}) FILTER (
    WHERE ${newsProvider.biasRating} IN (${BiasRatingKey.Right}, ${BiasRatingKey.CenterRight})
  ) as right_count
`;

/** Limits a ranking query to one side's blindspots; no-op without a side. */
export function blindspotFilter(side?: BlindspotSide) {
  if (!side) return sql``;
  const sideCount = side === "left" ? sql`left_count` : sql`right_count`;
  return sql`WHERE rated_count >= ${BLINDSPOT_MIN_RATED}
    AND round(${sideCount} * 100.0 / rated_count) >= ${BLINDSPOT_MIN_PERCENT}`;
}
