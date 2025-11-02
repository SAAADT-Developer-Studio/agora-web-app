import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "~/drizzle/schema";
import * as relations from "~/drizzle/relations";
import { Client, type ClientConfig } from "pg";
import "dotenv/config";
import { getProdCredentials } from "~/lib/db/credentials";
import { desc } from "drizzle-orm";

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

  const clusterRun = await prodDb.query.clusterRun.findFirst({
    orderBy: desc(schema.clusterRun.createdAt),
  });
  if (!clusterRun) {
    throw new Error(
      "No cluster run found in production database. Something is horribly wrong.",
    );
  }
  const clustersV2 = await prodDb.query.clusterV2.findMany({
    where: (cluster, { eq }) => eq(cluster.runId, clusterRun.id),
  });
  const articleClusters = await prodDb.query.articleCluster.findMany({
    where: (articleCluster, { eq }) => eq(articleCluster.runId, clusterRun.id),
  });
  // Get article IDs from the new cluster system
  const articleIdsFromClusters = new Set(
    articleClusters.map((ac) => ac.articleId),
  );
  const newsProviders = await prodDb.query.newsProvider.findMany();
  const clusters = await prodDb.query.cluster.findMany();
  const articles = await prodDb.query.article.findMany({
    where: (article, { isNotNull, inArray, or }) =>
      or(
        isNotNull(article.clusterId),
        inArray(article.id, Array.from(articleIdsFromClusters)),
      ),
  });
  const votes = await prodDb.query.vote.findMany({
    limit: 10000,
    orderBy: [desc(schema.vote.createdAt)],
  });
  const socialPosts = await prodDb.query.socialPost.findMany();
  const articleSocialPosts = await prodDb.query.articleSocialPost.findMany();

  await devDb.transaction(async (tx) => {
    // Delete in order: child tables first, then parent tables
    await tx.delete(schema.articleSocialPost);
    await tx.delete(schema.articleCluster);
    await tx.delete(schema.vote);
    await tx.delete(schema.article);
    await tx.delete(schema.socialPost);
    await tx.delete(schema.clusterV2);
    await tx.delete(schema.clusterRun);
    await tx.delete(schema.cluster);
    await tx.delete(schema.newsProvider);

    // Insert in order: parent tables first, then child tables
    await tx.insert(schema.newsProvider).values(newsProviders);
    await tx.insert(schema.cluster).values(clusters);
    await tx.insert(schema.clusterRun).values(clusterRun);
    await tx.insert(schema.clusterV2).values(clustersV2);
    if (socialPosts.length > 0) {
      await tx.insert(schema.socialPost).values(socialPosts);
    }
    await tx.insert(schema.article).values(articles);
    if (articleClusters.length > 0) {
      await tx.insert(schema.articleCluster).values(articleClusters);
    }
    if (articleSocialPosts.length > 0) {
      await tx.insert(schema.articleSocialPost).values(articleSocialPosts);
    }
    if (votes.length > 0) {
      await tx.insert(schema.vote).values(votes);
    }
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
