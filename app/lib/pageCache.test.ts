import { describe, expect, it } from "vitest";
import { clanekCacheControl } from "~/lib/articleClusterLookup";
import { pageCacheKey, shouldStorePageCache } from "~/lib/pageCache";

describe("page cache", () => {
  it("stores a degraded clanek for its 10 second cache and skips no-store", () => {
    const archived = new Headers({
      "Cache-Control": clanekCacheControl(true, false),
    });
    expect(shouldStorePageCache("/politika/clanek/stara", archived)).toBe(true);

    const degraded = new Headers({
      "Cache-Control": clanekCacheControl(true, true),
    });
    expect(degraded.get("Cache-Control")).toBe(
      "public, max-age=10, s-maxage=10",
    );
    expect(degraded.get("Cache-Control")).not.toMatch(/stale-while-revalidate/);
    expect(shouldStorePageCache("/politika/clanek/stara", degraded)).toBe(true);

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
});

describe("pageCacheKey", () => {
  it("changes with the build so old HTML is never served after a deploy", () => {
    const url = "https://vidik.si/politika?page=2";
    expect(pageCacheKey(url, "abc")).not.toBe(pageCacheKey(url, "def"));
    expect(pageCacheKey(url, "abc")).toBe(pageCacheKey(url, "abc"));
    const key = new URL(pageCacheKey(url, "abc"));
    expect(key.pathname).toBe("/politika");
    expect(key.searchParams.get("page")).toBe("2");
    expect(key.searchParams.get("__build")).toBe("abc");
  });
});
