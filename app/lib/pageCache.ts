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
