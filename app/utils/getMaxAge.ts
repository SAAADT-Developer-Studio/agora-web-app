import type { KVCache } from "~/lib/kvCache";
import { META_CACHE_KEY } from "~/lib/kvCache/keys";
import type { CacheMeta } from "~/routes/api/populate-cache";

export async function getMaxAge(kvCache: KVCache) {
  let maxAge = 3 * 60;
  const meta = await kvCache.get<CacheMeta>(META_CACHE_KEY);
  if (meta) {
    const age = Math.floor((Date.now() - meta.lastUpdated) / 1000);
    const remaining = Math.max(0, 10 * 60 - age);
    maxAge = Math.min(maxAge, remaining);
  }
  return maxAge;
}
