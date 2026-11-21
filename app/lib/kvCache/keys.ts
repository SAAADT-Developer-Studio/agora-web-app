import type { CategoryKeyValue } from "~/config";

// https://egghead.io/blog/using-branded-types-in-typescript
export type CacheKey = string & { __cacheKeyBrand: never };

/** Story-ranked home feed. Bump the prefix when the cached `ArticleType` shape or link target changes. */
export const HOME_CACHE_KEY = "data:story:home" as CacheKey;
export const META_CACHE_KEY = "meta" as CacheKey;

/**
 * Distinct from the formula keys so turning `STORY_RANK_ORDER` on or off
 * does not keep serving the other ordering until the previous TTL expires.
 */
const OBSERVED_RANK_CACHE_SUFFIX = ":observed-rank";

function cacheKeyForOrder(base: string, storyRankOrder: boolean): CacheKey {
  if (!storyRankOrder) return base as CacheKey;
  return `${base}${OBSERVED_RANK_CACHE_SUFFIX}` as CacheKey;
}

export function homeCacheKey(storyRankOrder = false): CacheKey {
  return cacheKeyForOrder(HOME_CACHE_KEY, storyRankOrder);
}

export function getCategoryCacheKey(
  category: CategoryKeyValue,
  storyRankOrder = false,
): CacheKey {
  return cacheKeyForOrder(`data:story:category:${category}`, storyRankOrder);
}

/** One page of the hidden `/utrinki` reel. */
export function utrinkiCacheKey(
  category: string,
  page: number,
  storyRankOrder = false,
): CacheKey {
  return cacheKeyForOrder(
    `data:story:utrinki:v1:${category}:${page}`,
    storyRankOrder,
  );
}

/** `/mediji` outlet landscape. Bump the version when `MediaLandscape` changes shape. */
export const MEDIA_LANDSCAPE_CACHE_KEY = "data:media-landscape:v1" as CacheKey;
