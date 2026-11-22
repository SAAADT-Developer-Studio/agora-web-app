import { describe, expect, it } from "vitest";
import {
  RAIL_SIZE,
  railStories,
  visibleRailStories,
  type RailStory,
} from "~/components/utrinki-rail";
import {
  emptyArticlesByCategory,
  type ArticleType,
} from "~/lib/services/ranking";

function card(id: number, to?: string): ArticleType {
  return {
    id: String(id),
    title: `Zgodba ${id}`,
    image: { src: id === 2 ? "" : `https://img/${id}.jpg`, alt: "" },
    tags: [],
    biasDistribution: {
      leftPercent: 50,
      centerPercent: 0,
      rightPercent: 50,
      leftCount: 1,
      centerCount: 0,
      rightCount: 1,
      totalCount: 2,
    },
    numberOfArticles: 2,
    providerKeys: [],
    to: to ?? `/zgodba/${id}`,
  };
}

describe("railStories", () => {
  it("takes home stories, then category stories rank by rank, without repeats", () => {
    const byCategory = emptyArticlesByCategory();
    byCategory.politika = [card(1), card(10)];
    byCategory.sport = [card(20)];
    const stories = railStories([card(1), card(2)], byCategory);

    expect(stories.map((story) => story.id)).toEqual([1, 2, 20, 10]);
    expect(stories[1].imageUrl).toBeNull();
  });

  it("skips cluster cards that do not link to a story", () => {
    const stories = railStories(
      [card(5, "/politika/clanek/5"), card(6)],
      emptyArticlesByCategory(),
    );
    expect(stories.map((story) => story.id)).toEqual([6]);
  });
});

function railStory(id: number): RailStory {
  return {
    id,
    title: `Zgodba ${id}`,
    imageUrl: null,
    updatedAt: "2026-11-20T10:00:00.000Z",
    bias: card(id).biasDistribution,
  };
}

describe("visibleRailStories", () => {
  const pool = Array.from({ length: 20 }, (_, index) => railStory(index + 1));
  const watched = { seenAt: 1, updatedAt: "2026-11-20T10:00:00.000Z" };

  it("replaces watched stories with older unwatched ones", () => {
    const seen = { "1": watched, "2": watched };
    const ids = visibleRailStories(pool, seen, {}).map((story) => story.id);

    expect(ids).toHaveLength(RAIL_SIZE);
    expect(ids).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it("brings a watched story back when it gets new coverage", () => {
    const seen = { "1": { seenAt: 1, updatedAt: "2026-11-19T10:00:00.000Z" } };
    expect(visibleRailStories(pool, seen, {})[0].id).toBe(1);
  });

  it("fills the row with watched stories only when nothing new is left", () => {
    const small = pool.slice(0, 3);
    const seen = { "1": watched };
    const ids = visibleRailStories(small, seen, { "2": { hiddenAt: 1 } }).map(
      (story) => story.id,
    );
    expect(ids).toEqual([3, 1]);
  });
});
