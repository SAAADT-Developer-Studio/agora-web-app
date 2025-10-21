import { createRequestHandler } from "react-router";
import { KVCache } from "~/lib/kvCache";
import { getDb, type Database } from "~/lib/db";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: Database;
    kvCache: KVCache;
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
      response = await requestHandler(request, {
        cloudflare: { env, ctx },
        db,
        kvCache,
      });
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
