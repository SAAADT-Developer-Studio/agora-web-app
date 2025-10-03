import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "~/drizzle/schema";
import * as relations from "~/drizzle/relations";
import { Client, type ClientConfig } from "pg";
import "dotenv/config";
import { getProdCredentials } from "~/lib/db/credentials";

async function getDb(config: ClientConfig | string) {
  const client = new Client(config);
  await client.connect();
  return drizzle(client, { schema: { ...schema, ...relations } });
}

// pull the most recent data from production to local dev db
async function main() {
  console.log("Seeding database...");

  const prodDb = await getDb(getProdCredentials());
  const devDb = await getDb(
    process.env.WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE!,
  );

  const newsProviders = await prodDb.query.newsProvider.findMany();
  const clusters = await prodDb.query.cluster.findMany();
  const articles = await prodDb.query.article.findMany({
    where: (article, { isNotNull }) => isNotNull(article.clusterId),
  });

  await devDb.transaction(async (tx) => {
    await tx.delete(schema.article);
    await tx.delete(schema.cluster);
    await tx.delete(schema.newsProvider);

    await tx.insert(schema.newsProvider).values(newsProviders);
    await tx.insert(schema.cluster).values(clusters);
    await tx.insert(schema.article).values(articles);
  });
}

main()
  .then(() => {
    console.log("Seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
