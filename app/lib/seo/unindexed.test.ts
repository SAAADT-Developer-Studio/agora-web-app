import { describe, expect, it } from "vitest";
import { shouldStorePageCache } from "~/lib/pageCache";
import {
  HIDDEN_NOT_FOUND_CACHE,
  NOT_FOUND_ROBOTS,
  clanekUnavailableResponse,
  hiddenNotFoundResponse,
  notFoundResponse,
} from "~/lib/seo/unindexed";

describe("not found robots", () => {
  it("marks a missing clanek or story noindex", () => {
    const response = notFoundResponse("Article Not Found");
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe(NOT_FOUND_ROBOTS);
    expect(NOT_FOUND_ROBOTS).toBe("noindex");
  });

  it("caches a hidden 404 for a minute and does not store an unknown remint", () => {
    const hidden = hiddenNotFoundResponse("Article Not Found");
    expect(hidden.status).toBe(404);
    expect(hidden.headers.get("Cache-Control")).toBe(HIDDEN_NOT_FOUND_CACHE);
    expect(hidden.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(shouldStorePageCache("/politika/clanek/old-a", hidden.headers)).toBe(
      true,
    );

    const unavailable = clanekUnavailableResponse();
    expect(unavailable.status).toBe(503);
    expect(unavailable.headers.get("Cache-Control")).toBe("no-store");
    expect(unavailable.headers.get("Retry-After")).toBe("10");
    expect(
      shouldStorePageCache("/politika/clanek/old-a", unavailable.headers),
    ).toBe(false);
  });
});
