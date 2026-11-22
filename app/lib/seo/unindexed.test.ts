import { describe, expect, it } from "vitest";
import {
  isUnindexedPath,
  UNINDEXED_ROBOTS,
  withUnindexedRobots,
} from "~/lib/seo/unindexed";

describe("unindexed paths", () => {
  it("leaves /utrinki indexable and hides the JSON continuation", () => {
    expect(isUnindexedPath("/utrinki")).toBe(false);
    expect(isUnindexedPath("/utrinki/")).toBe(false);
    expect(isUnindexedPath("/api/utrinki")).toBe(true);
    expect(isUnindexedPath("/api/utrinki/")).toBe(true);
    expect(isUnindexedPath("/")).toBe(false);
    expect(isUnindexedPath("/novo")).toBe(false);
    expect(isUnindexedPath("/zgodba/12")).toBe(false);
    expect(isUnindexedPath("/politika")).toBe(false);
  });

  it("does not stamp X-Robots-Tag on the /utrinki document", () => {
    const page = withUnindexedRobots(
      new Response("ok", {
        headers: { "Cache-Control": "public, max-age=60" },
      }),
      "/utrinki",
    );
    expect(page.headers.get("X-Robots-Tag")).toBeNull();
    expect(page.headers.get("Cache-Control")).toBe("public, max-age=60");

    const api = withUnindexedRobots(new Response("{}"), "/api/utrinki");
    expect(api.headers.get("X-Robots-Tag")).toBe(UNINDEXED_ROBOTS);
  });
});
