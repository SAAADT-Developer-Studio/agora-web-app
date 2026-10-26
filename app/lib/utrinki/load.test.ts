import { describe, expect, it } from "vitest";
import type { Database } from "~/lib/db";
import { loadUtrinkiPage } from "~/lib/utrinki/load";
import {
  assembleUtrinkiPage,
  formatCoverageSpan,
  parseUtrinkiQuery,
  toUtrinkiStory,
  updatedKicker,
  utrinkiPageHref,
  utrinkiWindow,
  type UtrinkiMember,
  type UtrinkiStory,
} from "~/lib/utrinki/model";
import { dwellBucket } from "~/lib/utrinki/analytics";

function member(
  id: number,
  bias: string | null,
  extra: Partial<UtrinkiMember> = {},
): UtrinkiMember {
  return {
    id,
    title: `Naslov ${id}`,
    url: `https://example.com/${id}`,
    publishedAt: "2026-08-20T10:00:00.000Z",
    summary: null,
    imageUrls: id === 1 ? ["https://images.example/a.jpg"] : null,
    categories: ["politika"],
    newsProvider: {
      key: `medij-${id}`,
      name: `Medij ${id}`,
      biasRating: bias,
      rank: id,
    },
    ...extra,
  };
}

describe("utrinki loader", () => {
  it("pages stories by tens and ignores unknown query values", () => {
    expect(utrinkiWindow(0)).toEqual({ page: 0, offset: 0, limit: 11 });
    expect(utrinkiWindow(2)).toEqual({ page: 2, offset: 20, limit: 11 });
    expect(utrinkiWindow(-3).page).toBe(0);
    expect(utrinkiWindow(80).page).toBe(50);

    const params = new URLSearchParams("kategorija=politika&stran=3");
    expect(parseUtrinkiQuery(params)).toEqual({
      category: "politika",
      page: 3,
    });
    expect(
      parseUtrinkiQuery(
        new URLSearchParams("kategorija=ni-kategorije&stran=x"),
      ),
    ).toEqual({ category: "aktualno", page: 0 });
    expect(utrinkiPageHref("aktualno", 0)).toBe("/utrinki");
    expect(utrinkiPageHref("politika", 2)).toBe(
      "/utrinki?kategorija=politika&stran=2",
    );
    expect(utrinkiPageHref("aktualno", 1, true)).toBe(
      "/utrinki?stran=1&osnutek=1",
    );
  });

  it("maps a story, keeps filter counts additive, and skips video stills", () => {
    const ratings = [
      ...Array.from({ length: 11 }, () => "left"),
      ...Array.from({ length: 5 }, () => "center"),
      ...Array.from({ length: 8 }, () => "right"),
    ];
    const members = ratings.map((bias, index) =>
      member(index + 1, bias, {
        publishedAt:
          index === 0 ? "2026-08-18T08:00:00.000Z" : "2026-08-24T18:00:00.000Z",
        imageUrls:
          index === 0
            ? ["https://cdn.example/clip.mp4"]
            : ["https://cdn.example/still.jpg"],
        newsProvider: {
          key: index < 15 ? `medij-${index}` : "medij-0",
          name: index === 0 ? "Delo" : `Medij ${index}`,
          biasRating: bias,
          rank: 1,
        },
      }),
    );
    const story = toUtrinkiStory({
      id: 42,
      title: "Delovni naslov",
      summaryTitle: "Brezovec &quot;brez maske&quot;",
      lastArticlePublishedAt: "2026-08-24T18:00:00.000Z",
      bullets: [{ text: "Koalicija razpravlja o odstopu.", article_ids: [1] }],
      members,
    });

    expect(story).not.toBeNull();
    expect(story?.title).toBe('Brezovec "brez maske"');
    expect(story?.summary).toBe("Koalicija razpravlja o odstopu.");
    expect(story?.imageUrl).toBe("https://cdn.example/still.jpg");
    expect(story?.storyPath).toBe("/zgodba/42");
    expect(story?.categoryLabel).toBe("POLITIKA");
    expect(story?.bias).toMatchObject({
      left: 11,
      center: 5,
      right: 8,
      unrated: 0,
      total: 24,
      leftPercent: 46,
      centerPercent: 21,
      rightPercent: 33,
    });
    expect(
      story &&
        story.bias.left +
          story.bias.center +
          story.bias.right +
          story.bias.unrated,
    ).toBe(story?.bias.total);
    expect(story?.coverageLabel).toContain("24 člankov");
    expect(
      formatCoverageSpan(
        "2026-08-18T08:00:00.000Z",
        "2026-08-24T18:00:00.000Z",
      ),
    ).toContain("18");
    expect(
      updatedKicker(
        "2026-10-25T10:00:00.000Z",
        Date.parse("2026-10-25T12:00:00.000Z"),
      ),
    ).toBe("POSODOBLJENO PRED 2 H");
    expect(
      toUtrinkiStory({
        id: 1,
        title: "Prazno",
        lastArticlePublishedAt: "2026-08-24T18:00:00.000Z",
        bullets: [],
        members: [],
      }),
    ).toBeNull();
  });

  it("asks the story ranker for one page plus a lookahead and keeps rank order", async () => {
    const calls: { category: string; count: number; offset: number }[] = [];
    const ranked = Array.from({ length: 11 }, (_, index) => ({
      id: String(100 + index),
    }));
    const page = await loadUtrinkiPage(
      { db: {} as Database, category: "aktualno", page: 2 },
      {
        rank: async (_db, category, count, offset) => {
          calls.push({ category, count, offset });
          return ranked;
        },
        hydrate: async (_db, ids) =>
          ids
            .filter((id) => id !== 105)
            .map(
              (id) =>
                ({
                  id,
                  title: `Zgodba ${id}`,
                  updatedAt: "2026-10-25T00:00:00.000Z",
                }) as UtrinkiStory,
            ),
      },
    );

    expect(calls).toEqual([{ category: "aktualno", count: 11, offset: 20 }]);
    expect(page.hasMore).toBe(true);
    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(10);
    expect(page.stories.map((story) => story.id)).toEqual([
      100, 101, 102, 103, 104, 106, 107, 108, 109,
    ]);

    const exact = assembleUtrinkiPage({
      rankedIds: [1, 2],
      stories: [{ id: 2 } as UtrinkiStory, { id: 1 } as UtrinkiStory],
      page: 0,
      category: "sport",
    });
    expect(exact.hasMore).toBe(false);
    expect(exact.stories.map((story) => story.id)).toEqual([1, 2]);
  });

  it("buckets dwell time for reel_view", () => {
    expect(dwellBucket(0)).toBe("0-3s");
    expect(dwellBucket(2999)).toBe("0-3s");
    expect(dwellBucket(3000)).toBe("3-10s");
    expect(dwellBucket(10_000)).toBe("10-30s");
    expect(dwellBucket(30_000)).toBe("30s+");
  });
});
