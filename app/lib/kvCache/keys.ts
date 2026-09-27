import type { CategoryKeyValue } from "~/config";

// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

export const HOME_CACHE_KEY = "data:v4:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;

export function getCategoryCacheKey(category: CategoryKeyValue) {
  return `data:v4:category:${category}` as CacheKey;
}
