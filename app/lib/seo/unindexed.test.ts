import { describe, expect, it } from "vitest";
import { NOT_FOUND_ROBOTS, notFoundResponse } from "~/lib/seo/unindexed";

describe("not found robots", () => {
  it("marks a missing clanek or story noindex", () => {
    const response = notFoundResponse("Article Not Found");
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe(NOT_FOUND_ROBOTS);
    expect(NOT_FOUND_ROBOTS).toBe("noindex");
  });
});
