/**
 * Thrown responses carry Cache-Control, X-Robots-Tag, Location, and
 * Retry-After. A route `headers()` that returns only Cache-Control drops
 * the rest, and a missing `headers()` drops them entirely.
 */
export function preserveThrownHeaders(input: {
  errorHeaders?: Headers;
  loaderHeaders: Headers;
}): Headers | HeadersInit {
  if (input.errorHeaders) return input.errorHeaders;
  if (input.loaderHeaders.get("Location")) return input.loaderHeaders;
  return { "Cache-Control": "max-age=10, s-maxage=10" };
}
