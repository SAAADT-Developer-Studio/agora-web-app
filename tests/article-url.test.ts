import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(
      parsed.titleSlug,
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe",
    );
    assert.notEqual(parsed.titleSlug, "18");
  });

  it("does not treat a timestamp-shaped slug as cluster id 2026", () => {
    const parsed = parseArticleParam(
      "zaporedje-odstopov-2026-10-17-16-13-523",
    );
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.titleSlug, "zaporedje-odstopov");
  });

  it("accepts an all-digit legacy cluster id", () => {
    const parsed = parseArticleParam("523");
    assert.deepEqual(parsed, { kind: "cluster-id", id: 523, raw: "523" });
  });

  it("strips only the run suffix from a title that contains a year", () => {
    const slug =
      "kulturni-bon-2025-kdo-ga-bo-dobil-2026-07-31-02-54-9";
    assert.equal(
      clusterTitleSlug(slug),
      "kulturni-bon-2025-kdo-ga-bo-dobil",
    );
  });
});

describe("storyPath", () => {
  it("is the permanent story url with no category or run timestamp", () => {
    assert.equal(storyPath(91), "/zgodba/91");
    assert.equal(storyPath(91).includes("2026"), false);
    assert.equal(storyPath(91).includes("clanek"), false);
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

    assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
    assert.match(xml, /<loc>https:\/\/vidik\.si\/zgodba\/91<\/loc>/);
    assert.match(xml, /<news:name>Vidik<\/news:name>/);
    assert.match(xml, /<news:language>sl<\/news:language>/);
    assert.match(
      xml,
      /<news:publication_date>2026-10-17T14:13:00.000Z<\/news:publication_date>/,
    );
    assert.match(xml, /<news:title>Tornado na Siciliji &amp; okolica<\/news:title>/);
    assert.equal(xml.includes("/clanek/"), false);
  });
});
