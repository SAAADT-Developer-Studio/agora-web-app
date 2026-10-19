import { describe, expect, it } from "vitest";
import { clanekCacheControl } from "~/lib/articleClusterLookup";
import { shouldStorePageCache } from "~/lib/pageCache";

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
