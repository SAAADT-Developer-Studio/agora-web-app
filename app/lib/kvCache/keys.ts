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

export function homeCacheKey(storyRankOrder = false): CacheKey {
  if (!storyRankOrder) return HOME_CACHE_KEY;
  return `${HOME_CACHE_KEY}${OBSERVED_RANK_CACHE_SUFFIX}` as CacheKey;
}

export function getCategoryCacheKey(
  category: CategoryKeyValue,
  storyRankOrder = false,
): CacheKey {
  const base = `data:story:category:${category}`;
  if (!storyRankOrder) return base as CacheKey;
  return `${base}${OBSERVED_RANK_CACHE_SUFFIX}` as CacheKey;
}
