import { getDb } from "~/lib/db";
import { article, cluster } from "~/drizzle/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import fallbackArticleImage from "~/assets/fallback.png";

export type Image = {
  src: string;
  alt: string;
};

export type ArticleType = {
  id: string;
  title: string;
  image: Image;
  tags: string[];
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
  showTags?: boolean;
  numberOfArticles: number;
};

const articleCount = sql<number>`count(${article.id})`.as("article_count");
const recencyScore = sql<number>`count(${article.id})`.as("recency_score");
// const rankScore = sql<number>`avg(${article.rank})`.as("rank_score");

const articleCountExpr = sql<number>`count(${article.id})`;
const recencyScoreExpr = sql<number>`count(${article.id})`;

export async function getHomeArticles({
  count,
}: {
  count: number;
}): Promise<ArticleType[]> {
  const db = await getDb();

  const topClusterIds = await db
    .select({
      id: cluster.id,
      article_count: articleCountExpr.as("article_count"),
      recency_score: recencyScoreExpr.as("recency_score"),
    })
    .from(cluster)
    .leftJoin(article, eq(cluster.id, article.clusterId))
    .groupBy(cluster.id)
    .orderBy(desc(sql`${articleCountExpr} * 0.4 + ${recencyScoreExpr} * 0.3`))

    .limit(count);
  return await common(db, topClusterIds);
}

export async function getCategoryArticles({
  category,
  count,
}: {
  category: string;
  count: number;
}): Promise<ArticleType[]> {
  const db = await getDb();
  const topClusterIds = await db
    .select({
      id: cluster.id,
      article_count: articleCountExpr.as("article_count"),
      recency_score: recencyScoreExpr.as("recency_score"),
    })
    .from(cluster)
    .leftJoin(article, eq(cluster.id, article.clusterId))
    .where(sql`${category} = ANY(${article.categories})`)
    .groupBy(cluster.id)
    .orderBy(desc(sql`${articleCountExpr} * 0.4 + ${recencyScoreExpr} * 0.3`))

    .limit(count);
  return await common(db, topClusterIds);
}

async function common(
  db: Awaited<ReturnType<typeof getDb>>,
  clusterIds: { id: number; article_count: number }[],
) {
  const topClusters = await db.query.cluster.findMany({
    where: inArray(
      cluster.id,
      clusterIds.map((c) => c.id),
    ),
    with: {
      articles: {
        columns: { imageUrls: true, categories: true },
      },
    },
  });
  topClusters.sort((a, b) => {
    const aCount = clusterIds.find((c) => c.id === a.id)?.article_count ?? 0;
    const bCount = clusterIds.find((c) => c.id === b.id)?.article_count ?? 0;
    return bCount - aCount;
  });

  const articles: ArticleType[] = topClusters.map((c) => {
    const imgSrc =
      c.articles.find((a) => a.imageUrls && a.imageUrls.length > 0)
        ?.imageUrls?.[0] ?? fallbackArticleImage;

    const tags = new Set(
      c.articles
        .map((a) => a.categories)
        .filter((c) => c !== null)
        .flat(),
    );
    return {
      id: c.id.toString(),
      title: c.title,
      image: {
        src: imgSrc,
        alt: "Placeholder Image 1",
      },
      tags: Array.from(tags),
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      showTags: true,
      numberOfArticles: c.articles.length,
    };
  });

  return articles;
}
