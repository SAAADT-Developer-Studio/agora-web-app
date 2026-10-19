/** Set on a response that must not be written to the Worker page cache. */
export const SKIP_PAGE_CACHE_HEADER = "X-Vidik-Skip-Page-Cache";

export function shouldStorePageCache(
  pathname: string,
  headers: Pick<Headers, "get">,
): boolean {
  if (pathname.startsWith("/dev")) return false;
  if (headers.get(SKIP_PAGE_CACHE_HEADER) === "1") return false;
  const cacheControl = headers.get("Cache-Control") ?? "";
  if (/\bno-store\b/i.test(cacheControl)) return false;
  return true;
}

export function withoutSkipPageCacheHeader(response: Response): Response {
  if (!response.headers.has(SKIP_PAGE_CACHE_HEADER)) return response;
  const headers = new Headers(response.headers);
  headers.delete(SKIP_PAGE_CACHE_HEADER);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
