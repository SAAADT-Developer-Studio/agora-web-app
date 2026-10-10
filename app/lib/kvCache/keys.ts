import type { CategoryKeyValue } from "~/config";

// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

export const HOME_CACHE_KEY = "data:v2:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;
/** Story-ranked `/novo` feed. Distinct from `HOME_CACHE_KEY` so the two never collide. */
export const NOVO_HOME_CACHE_KEY = "data:story:novo" as CacheKey;

export function getCategoryCacheKey(category: CategoryKeyValue) {
  return `data:v2:category:${category}` as CacheKey;
}
