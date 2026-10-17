import { createRequestHandler } from "react-router";
import { createAppLoadContext } from "~/lib/appContext";
import { shouldStorePageCache } from "~/lib/articleUrl";
import { KVCache } from "~/lib/kvCache";
import { getDb } from "~/lib/db";
import { Measurer } from "~/lib/measurer";
import { withUnindexedRobots } from "~/lib/seo/unindexed";

/** v1 cached poisoned 301/202 responses for `.data` navigations. */
const PAGE_CACHE = "custom:vidik-page-cache-v2";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const cache = await caches.open(PAGE_CACHE);

    const url = new URL(request.url);
    const lookupCache = shouldStorePageCache(url.pathname, 200, null);
    let response = lookupCache ? await cache.match(request) : undefined;

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
      if (
        shouldStorePageCache(
          url.pathname,
          response.status,
          response.headers.get("Cache-Control"),
        )
      ) {
        ctx.waitUntil(cache.put(request, response.clone()));
      }
    } else {
      response = withUnindexedRobots(response, url.pathname);
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
