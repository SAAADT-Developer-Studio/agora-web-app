/** Shared noindex policy for routes that are deployed but not listed. */
export const UNINDEXED_ROBOTS = "noindex, nofollow";

/** Missing and hidden clanek/story URLs. Search engines should drop them. */
export const NOT_FOUND_ROBOTS = "noindex";

/** Bots re-fetch a hidden URL; keep the 404 briefly so they miss Postgres. */
export const HIDDEN_NOT_FOUND_CACHE = "public, max-age=60, s-maxage=60";

export function notFoundResponse(message: string) {
  return new Response(message, {
    status: 404,
    headers: { "X-Robots-Tag": NOT_FOUND_ROBOTS },
  });
}

export function hiddenNotFoundResponse(message: string) {
  return new Response(message, {
    status: 404,
    headers: {
      "X-Robots-Tag": NOT_FOUND_ROBOTS,
      "Cache-Control": HIDDEN_NOT_FOUND_CACHE,
    },
  });
}

/** The old-URL check could not tell whether a hidden remint exists. */
export function clanekUnavailableResponse() {
  return new Response("Service Unavailable", {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Retry-After": "10",
      "X-Robots-Tag": NOT_FOUND_ROBOTS,
    },
  });
}

export function isUnindexedPath(pathname: string) {
  return (
    pathname === "/novo" ||
    pathname.startsWith("/novo/") ||
    pathname === "/zgodba" ||
    pathname.startsWith("/zgodba/")
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
