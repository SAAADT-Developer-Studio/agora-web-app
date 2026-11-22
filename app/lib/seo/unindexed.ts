/** `noindex` for the `/api/utrinki` JSON continuation. The `/utrinki` document is indexable. */
export const UNINDEXED_ROBOTS = "noindex, nofollow";

export function isUnindexedPath(pathname: string) {
  return pathname === "/api/utrinki" || pathname.startsWith("/api/utrinki/");
}

export function withUnindexedRobots(response: Response, pathname: string) {
  if (!isUnindexedPath(pathname)) return response;
  if (response.headers.get("X-Robots-Tag") === UNINDEXED_ROBOTS) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", UNINDEXED_ROBOTS);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
