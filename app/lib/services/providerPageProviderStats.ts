import type { Database } from "~/lib/db";

import { sql, and, gte, desc, count } from "drizzle-orm";
import { article } from "~/drizzle/schema";

export async function getProviderStats(db: Database, providerKey: string) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const currentDay = now.getDay();
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;

  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysToSubtract,
    0,
    0,
    0,
    0,
  );

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const [
    [todayCount],
    [weekCount],
    [monthCount],
    todayRankings,
    weekRankings,
    monthRankings,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(article)
      .where(
        and(
          sql`${article.newsProviderKey} = ${providerKey}`,
          gte(article.publishedAt, startOfToday.toISOString()),
        ),
      ),
    db
      .select({ count: count() })
      .from(article)
      .where(
        and(
          sql`${article.newsProviderKey} = ${providerKey}`,
          gte(article.publishedAt, startOfWeek.toISOString()),
        ),
      ),
    db
      .select({ count: count() })
      .from(article)
      .where(
        and(
          sql`${article.newsProviderKey} = ${providerKey}`,
          gte(article.publishedAt, startOfMonth.toISOString()),
        ),
      ),
    db
      .select({
        providerKey: article.newsProviderKey,
        count: count(),
      })
      .from(article)
      .where(gte(article.publishedAt, startOfToday.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
    db
      .select({
        providerKey: article.newsProviderKey,
        count: count(),
      })
      .from(article)
      .where(gte(article.publishedAt, startOfWeek.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
    db
      .select({
        providerKey: article.newsProviderKey,
        count: count(),
      })
      .from(article)
      .where(gte(article.publishedAt, startOfMonth.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
  ]);

  const todayRank =
    todayRankings.findIndex((r: any) => r.providerKey === providerKey) + 1;
  const weekRank =
    weekRankings.findIndex((r: any) => r.providerKey === providerKey) + 1;
  const monthRank =
    monthRankings.findIndex((r: any) => r.providerKey === providerKey) + 1;

  return {
    today: {
      count: todayCount.count,
      rank: todayRank || null,
      totalProviders: todayRankings.length,
    },
    week: {
      count: weekCount.count,
      rank: weekRank || null,
      totalProviders: weekRankings.length,
    },
    month: {
      count: monthCount.count,
      rank: monthRank || null,
      totalProviders: monthRankings.length,
    },
  };
}
