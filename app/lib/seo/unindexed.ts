/** Shared noindex policy for routes that are deployed but not listed. */
export const UNINDEXED_ROBOTS = "noindex, nofollow";

export function isUnindexedPath(pathname: string) {
  return (
    pathname === "/novo" ||
    pathname.startsWith("/novo/") ||
    pathname === "/zgodba" ||
    pathname.startsWith("/zgodba/") ||
    pathname === "/utrinki" ||
    pathname.startsWith("/utrinki/")
  );
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
