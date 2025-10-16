import { fetchCategoryArticlesData } from "~/routes/category";
import type { Route } from "./+types/populate-cache";
import { fetchHomeArticlesData } from "~/routes/home";
import { config } from "~/config";

export type CacheMeta = {
  lastUpdated: number;
};

// IMPORTANT !!!
// TODO: protect this route with a secret token or something

export async function action({ context }: Route.ActionArgs) {
  const { db, kvCache } = context;

  console.log("Populating cache...");

  const articles = await fetchHomeArticlesData({ db });

  kvCache.putDeferred("data:home", articles, { expirationTtl: 30 * 60 });

  const categoryResults = await Promise.allSettled(
    config.categories.map((c) =>
      fetchCategoryArticlesData({ db, category: c.key }),
    ),
  );

  categoryResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const category = config.categories[index].key;
      kvCache.putDeferred(`data:category:${category}`, result.value, {
        expirationTtl: 30 * 60,
      });
    } else {
      console.error(
        `Failed to fetch articles for category ${config.categories[index].key}: ${result.reason}`,
      );
    }
  });

  const nextMeta = { lastUpdated: Date.now() } satisfies CacheMeta;

  await kvCache.put("meta", nextMeta);

  console.log(
    "Cache populated at ",
    new Date(nextMeta.lastUpdated).toISOString(),
  );

  return new Response("Success", { status: 200 });
}
