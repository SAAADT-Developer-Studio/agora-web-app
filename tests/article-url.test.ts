import { describe, expect, it } from "vitest";
import {
  clusterTitleSlug,
  parseArticleParam,
  storyPath,
} from "../app/lib/articleUrl.ts";
import { renderNewsSitemap } from "../app/lib/seo/newsSitemap.ts";

describe("parseArticleParam", () => {
  it("keeps a digit-leading run slug on the slug path", () => {
    const slug =
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe-2026-10-17-16-13-17";
    const parsed = parseArticleParam(slug);
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.titleSlug).toBe(
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe",
    );
    expect(parsed.titleSlug).not.toBe("18");
  });

  it("does not treat a timestamp-shaped slug as cluster id 2026", () => {
    const parsed = parseArticleParam(
      "zaporedje-odstopov-2026-10-17-16-13-523",
    );
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.titleSlug).toBe("zaporedje-odstopov");
  });

  it("accepts an all-digit legacy cluster id", () => {
    const parsed = parseArticleParam("523");
    expect(parsed).toEqual({ kind: "cluster-id", id: 523, raw: "523" });
  });

  it("strips only the run suffix from a title that contains a year", () => {
    const slug = "kulturni-bon-2025-kdo-ga-bo-dobil-2026-07-31-02-54-9";
    expect(clusterTitleSlug(slug)).toBe("kulturni-bon-2025-kdo-ga-bo-dobil");
  });
});

describe("storyPath", () => {
  it("is the permanent story url with no category or run timestamp", () => {
    expect(storyPath(91)).toBe("/zgodba/91");
    expect(storyPath(91).includes("2026")).toBe(false);
    expect(storyPath(91).includes("clanek")).toBe(false);
  });
});

describe("renderNewsSitemap", () => {
  it("emits news entries for permanent urls", () => {
    const xml = renderNewsSitemap([
      {
        loc: "https://vidik.si/zgodba/91",
        title: "Tornado na Siciliji & okolica",
        publicationDate: new Date("2026-10-17T14:13:00.000Z"),
        publicationName: "Vidik",
        language: "sl",
      },
    ]);

    expect(xml).toMatch(
      /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/,
    );
    expect(xml).toMatch(/<loc>https:\/\/vidik\.si\/zgodba\/91<\/loc>/);
    expect(xml).toMatch(/<news:name>Vidik<\/news:name>/);
    expect(xml).toMatch(/<news:language>sl<\/news:language>/);
    expect(xml).toMatch(
      /<news:publication_date>2026-10-17T14:13:00.000Z<\/news:publication_date>/,
    );
    expect(xml).toMatch(
      /<news:title>Tornado na Siciliji &amp; okolica<\/news:title>/,
    );
    expect(xml.includes("/clanek/")).toBe(false);
  });
});
