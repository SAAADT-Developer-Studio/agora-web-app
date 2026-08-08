import { createContext, RouterContextProvider } from "react-router";
import type { Database } from "~/lib/db";
import type { KVCache } from "~/lib/kvCache";
import type { Measurer } from "~/lib/measurer";

export type AppCloudflareContext = {
  env: Env;
  ctx: ExecutionContext;
};

export const cloudflareContext = createContext<AppCloudflareContext>();
export const dbContext = createContext<Database>();
export const kvCacheContext = createContext<KVCache>();
export const measurerContext = createContext<Measurer>();

export type AppContext = {
  cloudflare: AppCloudflareContext;
  db: Database;
  kvCache: KVCache;
  measurer: Measurer;
};

export function createAppLoadContext(values: AppContext) {
  const context = new RouterContextProvider();
  context.set(cloudflareContext, values.cloudflare);
  context.set(dbContext, values.db);
  context.set(kvCacheContext, values.kvCache);
  context.set(measurerContext, values.measurer);
  return context;
}

export function getAppContext(
  context: Pick<RouterContextProvider, "get">,
): AppContext {
  return {
    cloudflare: context.get(cloudflareContext),
    db: context.get(dbContext),
    kvCache: context.get(kvCacheContext),
    measurer: context.get(measurerContext),
  };
}
