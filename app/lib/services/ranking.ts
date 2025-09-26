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

export async function getHomeArticles(): Promise<ArticleType[]> {
  const db = await getDb();
  const articleCount = sql<number>`count(${article.id})`.as("article_count");

  const topClusterIds = await db
    .select({
      id: cluster.id,
      article_count: articleCount,
    })
    .from(cluster)
    .leftJoin(article, eq(cluster.id, article.clusterId))
    .groupBy(cluster.id)
    .orderBy(desc(articleCount))
    .limit(6);

  const topClusters = await db.query.cluster.findMany({
    where: inArray(
      cluster.id,
      topClusterIds.map((c) => c.id),
    ),
    with: {
      articles: {
        columns: { imageUrls: true },
      },
    },
  });
  topClusters.sort((a, b) => {
    const aCount = topClusterIds.find((c) => c.id === a.id)?.article_count ?? 0;
    const bCount = topClusterIds.find((c) => c.id === b.id)?.article_count ?? 0;
    return bCount - aCount;
  });

  const articles: ArticleType[] = topClusters.map((c) => {
    const imgSrc =
      c.articles.find((a) => a.imageUrls && a.imageUrls.length > 0)
        ?.imageUrls?.[0] ?? fallbackArticleImage;
    return {
      id: c.id.toString(),
      title: c.title,
      image: {
        src: imgSrc,
        alt: "Placeholder Image 1",
      },
      tags: ["sport", "gaming"],
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      showTags: true,
      numberOfArticles: c.articles.length,
    };
  });

  return articles;
}
