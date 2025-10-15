import type { Route } from "./+types/populate-cache";
import { fetchHomeArticlesData } from "~/routes/home";
import { getEnv } from "~/utils/getEnv";

type Meta = {
  lastUpdated: number;
};

// IMPORTANT !!!
// TODO: protect this route with a secret token or something

export async function action({ context }: Route.ActionArgs) {
  const { cloudflare, db } = context;
  const cache = cloudflare.env.VIDIK_CACHE;
  const env = getEnv();

  const articles = await fetchHomeArticlesData({ db });

  const cacheKey = `${env}:data:home`;

  await cache.put(cacheKey, JSON.stringify(articles), {
    expirationTtl: 30 * 60,
  });

  const nextMeta = { lastUpdated: Date.now() } satisfies Meta;

  await cache.put(`${env}:meta`, JSON.stringify(nextMeta));

  return new Response("Success", { status: 200 });
}
