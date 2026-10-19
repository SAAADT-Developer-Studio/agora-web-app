import { describe, expect, it } from "vitest";
import { clanekCacheControl } from "~/lib/articleClusterLookup";
import {
  SKIP_PAGE_CACHE_HEADER,
  shouldStorePageCache,
  withoutSkipPageCacheHeader,
} from "~/lib/pageCache";

describe("page cache", () => {
  it("stores a settled archive and skips a degraded clanek response", () => {
    const archived = new Headers({
      "Cache-Control": clanekCacheControl(true, false),
    });
    expect(shouldStorePageCache("/politika/clanek/stara", archived)).toBe(true);

    const degraded = new Headers({
      "Cache-Control": clanekCacheControl(true, true),
      [SKIP_PAGE_CACHE_HEADER]: "1",
    });
    expect(degraded.get("Cache-Control")).toBe(
      "public, max-age=10, s-maxage=10",
    );
    expect(degraded.get("Cache-Control")).not.toMatch(/stale-while-revalidate/);
    expect(shouldStorePageCache("/politika/clanek/stara", degraded)).toBe(
      false,
    );
    expect(
      shouldStorePageCache(
        "/politika/clanek/stara",
        new Headers({ "Cache-Control": "public, no-store" }),
      ),
    ).toBe(false);
    expect(shouldStorePageCache("/dev/compare-clustering", archived)).toBe(
      false,
    );
  });

  it("strips the skip header before the response leaves the worker", () => {
    const response = withoutSkipPageCacheHeader(
      new Response("ok", {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=10",
          [SKIP_PAGE_CACHE_HEADER]: "1",
        },
      }),
    );
    expect(response.headers.get(SKIP_PAGE_CACHE_HEADER)).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=10, s-maxage=10",
    );
  });
});
