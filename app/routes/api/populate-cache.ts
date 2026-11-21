import { fetchCategoryArticlesData } from "~/routes/category";
import { getAppContext } from "~/lib/appContext";
import type { Route } from "./+types/populate-cache";
import {
  createObservedRankSession,
  fetchHomeArticlesData,
} from "~/lib/services/storyRanking";
import { config } from "~/config";
import {
  getCategoryCacheKey,
  homeCacheKey,
  META_CACHE_KEY,
} from "~/lib/kvCache/keys";
import { storyRankOrderFromEnv } from "~/lib/storyRankOrder";

export type CacheMeta = {
  lastUpdated: number;
};

// IMPORTANT !!!
// TODO: protect this route with a secret token or something

export async function action({ context }: Route.ActionArgs) {
  const { db, kvCache, cloudflare } = getAppContext(context);
  const storyRankOrder = storyRankOrderFromEnv(cloudflare.env);
  const rankSession = createObservedRankSession();

  console.log("Populating cache...");

  const articles = await fetchHomeArticlesData({
    db,
    storyRankOrder,
    rankSession,
  });

  kvCache.putDeferred(homeCacheKey(storyRankOrder), articles, {
    expirationTtl: 30 * 60,
  });

  const categoryResults = await Promise.allSettled(
    config.categories.map((c) =>
      fetchCategoryArticlesData({
        db,
        category: c.key,
        storyRankOrder,
        rankSession,
      }),
    ),
  );

  categoryResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const category = config.categories[index].key;
      kvCache.putDeferred(
        getCategoryCacheKey(category, storyRankOrder),
        result.value,
        {
          expirationTtl: 30 * 60,
        },
      );
    } else {
      console.error(
        `Failed to fetch articles for category ${config.categories[index].key}: ${result.reason}`,
      );
    }
  });

  const nextMeta = { lastUpdated: Date.now() } satisfies CacheMeta;

  await kvCache.put(META_CACHE_KEY, nextMeta);

  console.log(
    "Cache populated at ",
    new Date(nextMeta.lastUpdated).toISOString(),
  );

  return new Response("Success", { status: 200 });
}
