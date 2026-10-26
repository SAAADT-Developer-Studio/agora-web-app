import type { Database } from "~/lib/db";
import {
  getStoryCategoryArticles,
  getStoryHomeArticles,
} from "~/lib/services/storyRanking";
import {
  assembleUtrinkiPage,
  toUtrinkiStory,
  utrinkiWindow,
  type UtrinkiCategory,
  type UtrinkiPage,
  type UtrinkiStory,
} from "~/lib/utrinki/model";

type Ranked = { id: string };

async function rankStories(
  db: Database,
  category: UtrinkiCategory,
  count: number,
  offset: number,
): Promise<Ranked[]> {
  if (category === "aktualno") {
    return getStoryHomeArticles({ db, count, offset });
  }
  return getStoryCategoryArticles({
    db,
    ignoredClusterIds: [],
    category,
    count,
    offset,
  });
}

export async function hydrateUtrinkiStories(
  db: Database,
  ids: readonly number[],
): Promise<UtrinkiStory[]> {
  if (ids.length === 0) return [];

  const rows = await db.query.story.findMany({
    where: (table, { inArray }) => inArray(table.id, [...ids]),
    columns: { id: true, title: true, lastArticlePublishedAt: true },
    with: {
      storySummaries: {
        columns: { bullets: true, title: true },
        orderBy: (table, { desc }) => [desc(table.id)],
        limit: 1,
      },
      storyArticles: {
        columns: {},
        with: {
          article_articleId: {
            columns: {
              id: true,
              title: true,
              url: true,
              publishedAt: true,
              summary: true,
              imageUrls: true,
              categories: true,
              newsProviderKey: true,
            },
            with: { newsProvider: true },
          },
        },
      },
    },
  });

  const byId = new Map<number, UtrinkiStory>();
  for (const row of rows) {
    const members = row.storyArticles.map((link) => link.article_articleId);
    const summary = row.storySummaries[0];
    const story = toUtrinkiStory({
      id: row.id,
      title: row.title,
      summaryTitle: summary?.title,
      lastArticlePublishedAt: row.lastArticlePublishedAt,
      bullets: summary?.bullets,
      members: members.map((member) => ({
        id: member.id,
        title: member.title,
        url: member.url,
        publishedAt: member.publishedAt,
        summary: member.summary,
        imageUrls: member.imageUrls,
        categories: member.categories,
        newsProvider: {
          key: member.newsProvider.key,
          name: member.newsProvider.name,
          biasRating: member.newsProvider.biasRating,
          rank: member.newsProvider.rank,
        },
      })),
    });
    if (story) byId.set(story.id, story);
  }

  return ids.flatMap((id) => {
    const story = byId.get(id);
    return story ? [story] : [];
  });
}

export async function loadUtrinkiPage(
  {
    db,
    category,
    page,
  }: { db: Database; category: UtrinkiCategory; page: number },
  deps: {
    rank?: typeof rankStories;
    hydrate?: typeof hydrateUtrinkiStories;
  } = {},
): Promise<UtrinkiPage> {
  const window = utrinkiWindow(page);
  const rank = deps.rank ?? rankStories;
  const hydrate = deps.hydrate ?? hydrateUtrinkiStories;
  const ranked = await rank(db, category, window.limit, window.offset);
  const rankedIds = ranked.map((article) => Number(article.id));
  const stories = await hydrate(db, rankedIds.slice(0, window.limit - 1));
  return assembleUtrinkiPage({
    rankedIds,
    stories,
    page: window.page,
    category,
  });
}
