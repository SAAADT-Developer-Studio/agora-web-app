import { describe, expect, it } from "vitest";
import { isUnindexedPath } from "~/lib/seo/unindexed";

describe("unindexed paths", () => {
  it("hides /utrinki the same way as /novo and /zgodba", () => {
    expect(isUnindexedPath("/utrinki")).toBe(true);
    expect(isUnindexedPath("/utrinki/")).toBe(true);
    expect(isUnindexedPath("/api/utrinki")).toBe(true);
    expect(isUnindexedPath("/novo")).toBe(true);
    expect(isUnindexedPath("/")).toBe(false);
  });
});
