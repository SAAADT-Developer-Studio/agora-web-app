import { describe, expect, it } from "vitest";
import { railStories } from "~/components/utrinki-rail";
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
  it("takes home stories, then each category's top story, without repeats", () => {
    const byCategory = emptyArticlesByCategory();
    byCategory.politika = [card(1), card(10)];
    byCategory.sport = [card(20)];
    const stories = railStories([card(1), card(2)], byCategory);

    expect(stories.map((story) => story.id)).toEqual([1, 2, 20]);
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
