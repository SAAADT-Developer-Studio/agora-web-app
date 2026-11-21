import type { CategoryKeyValue } from "~/config";

// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

/** Story-ranked home feed. Bump the prefix when the cached `ArticleType` shape or link target changes. */
export const HOME_CACHE_KEY = "data:story:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;

export function getCategoryCacheKey(category: CategoryKeyValue) {
  return `data:story:category:${category}` as CacheKey;
}
