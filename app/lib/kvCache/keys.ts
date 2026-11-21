import type { CategoryKeyValue } from "~/config";

// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

/** Story-ranked home feed. Bump the prefix when the cached `ArticleType` shape or link target changes. */
export const HOME_CACHE_KEY = "data:story:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;

export function getCategoryCacheKey(category: CategoryKeyValue) {
  return `data:story:category:${category}` as CacheKey;
}

/**
 * Listing feeds refresh in the background after `FEED_STALE_AFTER` seconds and
 * are only dropped after `FEED_EXPIRATION_TTL`, so a gap in `populate-cache`
 * calls serves a slightly old feed instead of a multi-second rebuild.
 */
export const FEED_STALE_AFTER = 10 * 60;
export const FEED_EXPIRATION_TTL = 24 * 60 * 60;
