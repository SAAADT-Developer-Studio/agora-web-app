import { describe, expect, it } from "vitest";
import { headers, meta } from "~/routes/utrinki";
import { loader as robotsLoader } from "~/routes/robots";
import { SITE_URL } from "~/lib/seo";

const INDEXABLE_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function userAgentGroups(text: string) {
  return text
    .split(/(?=^User-agent: )/m)
    .map((block) => {
      const agent = block.match(/^User-agent: (.+)$/m)?.[1]?.trim();
      return agent ? { agent, block } : undefined;
    })
    .filter((group) => group !== undefined);
}

describe("indexable utrinki", () => {
  it("marks the reel indexable", () => {
    const tags = meta({
      location: { pathname: "/utrinki" },
    } as Parameters<typeof meta>[0]);
    expect(tags).toContainEqual({
      name: "robots",
      content: INDEXABLE_ROBOTS,
    });
    expect(tags).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: `${SITE_URL}/utrinki`,
    });
    expect(JSON.stringify(tags)).not.toContain("noindex");

    const responseHeaders = headers({
      loaderHeaders: new Headers({
        "Cache-Control": "public, max-age=60",
      }),
    } as Parameters<typeof headers>[0]);
    const xRobots =
      responseHeaders instanceof Headers
        ? responseHeaders.get("X-Robots-Tag")
        : responseHeaders["X-Robots-Tag"];
    expect(xRobots ?? null).toBeNull();
    const cacheControl =
      responseHeaders instanceof Headers
        ? responseHeaders.get("Cache-Control")
        : responseHeaders["Cache-Control"];
    expect(cacheControl).toBe("public, max-age=60");
  });

  it("allows /utrinki in every robots.txt group", async () => {
    const response = await robotsLoader(
      {} as Parameters<typeof robotsLoader>[0],
    );
    const text = await response.text();
    const groups = userAgentGroups(text);

    expect(groups.map((group) => group.agent)).toEqual([
      "*",
      "GPTBot",
      "ChatGPT-User",
      "ClaudeBot",
      "anthropic-ai",
      "Google-Extended",
      "PerplexityBot",
      "Applebot-Extended",
    ]);
    for (const group of groups) {
      expect(group.block).not.toContain("Disallow: /utrinki");
    }
    expect(text).not.toContain("Disallow: /utrinki");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Disallow: /dev/");
    expect(text).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(text).not.toContain("Disallow: /novo");
    expect(text).not.toContain("Disallow: /zgodba");
  });
});
