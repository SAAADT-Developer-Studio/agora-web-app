import { describe, expect, it } from "vitest";
import { isUnindexedPath } from "~/lib/seo/unindexed";

describe("unindexed paths", () => {
  it("hides /utrinki and leaves the public site indexable", () => {
    expect(isUnindexedPath("/utrinki")).toBe(true);
    expect(isUnindexedPath("/utrinki/")).toBe(true);
    expect(isUnindexedPath("/api/utrinki")).toBe(true);
    expect(isUnindexedPath("/api/utrinki/")).toBe(true);
    expect(isUnindexedPath("/")).toBe(false);
    expect(isUnindexedPath("/novo")).toBe(false);
    expect(isUnindexedPath("/zgodba/12")).toBe(false);
    expect(isUnindexedPath("/politika")).toBe(false);
  });
});
