// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

export const HOME_CACHE_KEY = "data:v2:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;

export function getCategoryCacheKey(category: string) {
  return `data:v2:category:${category}` as CacheKey;
}
