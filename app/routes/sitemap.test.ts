import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/appContext", () => ({
  getAppContext: () => ({
    kvCache: {
      get: async () => ({ lastUpdated: "2026-01-15T12:00:00.000Z" }),
    },
    db: {
      query: {
        newsProvider: {
          findMany: async () => [],
        },
      },
      execute: async () => ({ rows: [] }),
    },
  }),
}));

import { loader } from "~/routes/sitemap";
import { SITE_URL } from "~/lib/seo";

describe("sitemap", () => {
  it("lists /utrinki", async () => {
    const response = await loader({} as Parameters<typeof loader>[0]);
    const xml = await response.text();
    expect(xml).toContain(
      `<url><loc>${SITE_URL}/utrinki</loc><lastmod>2026-01-15T12:00:00.000Z</lastmod><priority>0.8</priority></url>`,
    );
    expect(xml).not.toContain("noindex");
  });
});
