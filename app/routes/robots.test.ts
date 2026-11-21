import { describe, expect, it } from "vitest";
import { headers, meta } from "~/routes/utrinki";
import { loader as robotsLoader } from "~/routes/robots";

describe("hidden utrinki", () => {
  it("marks the reel noindex", () => {
    const tags = meta({
      location: { pathname: "/utrinki" },
    } as Parameters<typeof meta>[0]);
    expect(tags).toContainEqual({
      name: "robots",
      content: "noindex, nofollow",
    });

    const responseHeaders = headers({
      loaderHeaders: new Headers(),
    } as Parameters<typeof headers>[0]);
    expect(
      responseHeaders instanceof Headers
        ? responseHeaders.get("X-Robots-Tag")
        : responseHeaders["X-Robots-Tag"],
    ).toBe("noindex, nofollow");
  });

  it("disallows /utrinki without hiding the public story pages", async () => {
    const response = await robotsLoader(
      {} as Parameters<typeof robotsLoader>[0],
    );
    const text = await response.text();
    expect(text).toContain("Disallow: /utrinki");
    expect(text).not.toContain("Disallow: /novo");
    expect(text).not.toContain("Disallow: /zgodba");
  });
});
