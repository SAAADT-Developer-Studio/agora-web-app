/**
 * The Worker page cache stores whatever `cache.put` accepts.
 * `Cache-Control` (`max-age` / `s-maxage`) is the freshness window, including
 * the 10 second degraded clanek response. `no-store` is not stored: `cache.put`
 * rejects it. `/dev` stays out of the cache entirely.
 */
export function shouldStorePageCache(
  pathname: string,
  headers: Pick<Headers, "get">,
): boolean {
  if (pathname.startsWith("/dev")) return false;
  const cacheControl = headers.get("Cache-Control") ?? "";
  if (/\bno-store\b/i.test(cacheControl)) return false;
  return true;
}

/**
 * Cache key for a page. Includes the build's asset version: cached HTML links
 * hashed `/assets/*` files, and a deploy deletes the previous build's files.
 * Keyed by URL alone, a page cached before a deploy would be served afterwards
 * with CSS and JS that 404. A new version starts with an empty cache.
 */
export function pageCacheKey(url: string, assetsVersion: string): string {
  const key = new URL(url);
  key.searchParams.set("__build", assetsVersion);
  return key.toString();
}
