import { count, desc, asc, gte, and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db";
import { newsProvider, article } from "~/drizzle/schema";

export async function getProviderStats({
  count: providerCount,
}: {
  count: number;
}) {
  const db = await getDb();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const result = await db
    .select({
      key: newsProvider.key,
      name: newsProvider.name,
      url: newsProvider.url,
      rank: newsProvider.rank,
      biasRating: newsProvider.biasRating,
      articleCount: count(article.id),
    })
    .from(newsProvider)
    .leftJoin(
      article,
      and(
        eq(newsProvider.key, article.newsProviderKey),
        gte(article.publishedAt, oneWeekAgo.toISOString()),
      ),
    )
    .groupBy(
      newsProvider.key,
      newsProvider.name,
      newsProvider.url,
      newsProvider.rank,
      newsProvider.biasRating,
    )
    .orderBy(desc(count(article.id)), asc(newsProvider.rank))
    .limit(providerCount);

  return result;
}
