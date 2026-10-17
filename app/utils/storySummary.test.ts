import { describe, expect, it } from "vitest";
import { parseStoryBullets } from "~/utils/storySummary";

const members = new Set([1, 2, 3]);

describe("parseStoryBullets", () => {
  it("maps stored bullets to text and member article ids", () => {
    const raw = [
      { text: "Vlada je sprejela proračun.", article_ids: [1, 2] },
      { text: "Opozicija napoveduje referendum.", article_ids: [3] },
    ];

    expect(parseStoryBullets(raw, members)).toEqual([
      { text: "Vlada je sprejela proračun.", articleIds: [1, 2] },
      { text: "Opozicija napoveduje referendum.", articleIds: [3] },
    ]);
  });

  it("drops article ids that are no longer in the story and duplicates", () => {
    const raw = [{ text: "Dejstvo.", article_ids: [2, 99, 2, "1"] }];

    expect(parseStoryBullets(raw, members)).toEqual([
      { text: "Dejstvo.", articleIds: [2] },
    ]);
  });

  it("skips entries without usable text and trims whitespace", () => {
    const raw = [
      { text: "   ", article_ids: [1] },
      { article_ids: [1] },
      null,
      "loose string",
      { text: "  Ostane.  " },
    ];

    expect(parseStoryBullets(raw, members)).toEqual([
      { text: "Ostane.", articleIds: [] },
    ]);
  });

  it("returns no bullets for anything that isn't an array", () => {
    expect(parseStoryBullets(null, members)).toEqual([]);
    expect(parseStoryBullets({ text: "x" }, members)).toEqual([]);
    expect(parseStoryBullets(undefined, members)).toEqual([]);
  });
});
