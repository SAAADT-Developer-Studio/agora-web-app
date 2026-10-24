import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Database } from "~/lib/db";
import { newsProvider } from "~/drizzle/schema";

export type RandomProvider = Awaited<
  ReturnType<typeof fetchRandomProviders>
>[number];

/** One rated outlet per rank tier, for the voting card. */
export async function fetchRandomProviders({ db }: { db: Database }) {
  const cols = {
    name: newsProvider.name,
    key: newsProvider.key,
    url: newsProvider.url,
    rank: newsProvider.rank,
    biasRating: newsProvider.biasRating,
  };

  const rank0Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 0), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank1Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 1), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank2Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 2), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank3Promise = db
    .select(cols)
    .from(newsProvider)
    .where(
      and(
        inArray(newsProvider.rank, [3, 4]),
        isNotNull(newsProvider.biasRating),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const [rank0, rank1, rank2, rank3] = await Promise.all([
    rank0Promise,
    rank1Promise,
    rank2Promise,
    rank3Promise,
  ]);

  const allProviders = [...rank0, ...rank1, ...rank2, ...rank3];

  return allProviders.map((p) => ({
    name: p.name,
    key: p.key,
    url: p.url,
    rank: p.rank,
    biasRating: p.biasRating,
  }));
}
