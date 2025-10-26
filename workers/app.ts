import { createRequestHandler } from "react-router";
import { KVCache } from "~/lib/kvCache";
import { getDb, type Database } from "~/lib/db";
import { Measurer } from "~/lib/measurer";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: Database;
    kvCache: KVCache;
    measurer: Measurer;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const cache = await caches.open("custom:vidik-page-cache");

    let response = await cache.match(request);

    if (!response) {
      const db = await getDb(env.HYPERDRIVE.connectionString);
      const kvCache = new KVCache(env.VIDIK_CACHE, ctx);
      const measurer = new Measurer();
      response = await requestHandler(request, {
        cloudflare: { env, ctx },
        db,
        kvCache,
        measurer,
      });
      if (import.meta.env.DEV || !response.headers.has("Cache-Control")) {
        response.headers.set(
          "Cache-Control",
          "public, max-age=0, must-revalidate",
        );
      }
      measurer.toHeaders(response.headers);
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
