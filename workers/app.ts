import { createRequestHandler } from "react-router";
import { createAppLoadContext } from "~/lib/appContext";
import { KVCache } from "~/lib/kvCache";
import { getDb } from "~/lib/db";
import { Measurer } from "~/lib/measurer";
import { pageCacheKey, shouldStorePageCache } from "~/lib/pageCache";
import { withUnindexedRobots } from "~/lib/seo/unindexed";

const loadServerBuild = () => import("virtual:react-router/server-build");
const requestHandler = createRequestHandler(
  loadServerBuild,
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const cache = await caches.open("custom:vidik-page-cache");

    const url = new URL(request.url);
    // Only GET pages are cached; the Cache API cannot store other methods.
    const skipCache =
      request.method !== "GET" || url.pathname.startsWith("/dev");
    const { assets } = await loadServerBuild();
    const cacheKey = pageCacheKey(request.url, assets.version);
    let response = skipCache ? undefined : await cache.match(cacheKey);

    if (!response) {
      const db = await getDb(env.HYPERDRIVE.connectionString);
      const kvCache = new KVCache(env.VIDIK_CACHE, ctx);
      const measurer = new Measurer();
      response = await requestHandler(
        request,
        createAppLoadContext({
          cloudflare: { env, ctx },
          db,
          kvCache,
          measurer,
        }),
      );
      if (import.meta.env.DEV || !response.headers.has("Cache-Control")) {
        response.headers.set(
          "Cache-Control",
          "public, max-age=0, must-revalidate",
        );
      }
      response = withUnindexedRobots(response, url.pathname);
      if (!skipCache && shouldStorePageCache(url.pathname, response.headers)) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    } else {
      response = withUnindexedRobots(response, url.pathname);
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
