import type { Database } from "~/lib/db";
import {
  article,
  articleSocialPost,
  newsProvider,
  story,
  storyArticle,
} from "~/drizzle/schema";
import { sql } from "drizzle-orm";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import {
  extractCarouselImages,
  extractHeroImage,
} from "~/utils/extractHeroImage";
import { config, defineCategoryMap, type CategoryKeyValue } from "~/config";
import {
  biasCountColumns,
  blindspotFilter,
  emptyArticlesByCategory,
  newestPublishedAt,
  type ArticleType,
} from "~/lib/services/ranking";
import { BLINDSPOTS_PER_SIDE, type BlindspotSide } from "~/utils/blindspots";

const CATEGORY_PRIORITY = defineCategoryMap({
  politika: 6,
  gospodarstvo: 6,
  kriminal: 5,
  lokalno: 5,
  "tehnologija-znanost": 4,
  sport: 2,
  kultura: 2,
  zdravje: 1,
  okolje: 1,
});

const MAX_CATEGORY_PRIORITY = Math.max(...Object.values(CATEGORY_PRIORITY));

const categoryPriorityCases = sql.join(
  (Object.entries(CATEGORY_PRIORITY) as [CategoryKeyValue, number][]).map(
    ([key, priority]) => sql`WHEN ${key} THEN ${priority}`,
  ),
  sql.raw(" "),
);

// Decay constant: articles lose ~63% relevance every 12 hours
// Formula: exp(-hours_since_publication / 12)
const RECENCY_DECAY_HOURS = 12;

const recencyScoreExpr = sql<number>`
  max(
    exp(
      -extract(epoch from (now() - ${article.publishedAt}::timestamptz)) / 3600 / ${RECENCY_DECAY_HOURS}
    )
  )
`;

// Category score: average priority of first category across articles, normalized by max priority
const categoryScoreExpr = sql<number>`
  avg(
    CASE ${article.categories}[1]
      ${categoryPriorityCases}
      ELSE 0
    END
  ) / ${MAX_CATEGORY_PRIORITY}
`;

// Stories aren't run-scoped; 14d window stands in for latest cluster_run
const recentStoriesFilter = sql`${story.lastArticlePublishedAt} > now() - interval '14 days'`;

export async function getStoryHomeArticles({
  db,
  count,
  side,
}: {
  db: Database;
  count: number;
  /** Only this side's blindspots, still in ranking order. */
  side?: BlindspotSide;
}): Promise<ArticleType[]> {
  const topStoryIds = await db.execute(sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      ${categoryScoreExpr} as category_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles,
      ${biasCountColumns}
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN ${newsProvider} ON ${article.newsProviderKey} = ${newsProvider.key}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      category_score,
      social_post_count,
      max_provider_articles,
      rated_count,
      left_count,
      right_count,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    id,
    article_count,
    cluster_llm_rank_score,
    recency_score,
    category_score,
    social_score,

    (max_provider_articles::float / NULLIF(article_count, 0)) as dominance,
    (cluster_llm_rank_score * 0.4 + recency_score * 0.20 + category_score * 0.20 + social_score * 0.20) as base_score,
    (
      (cluster_llm_rank_score * 0.4 + recency_score * 0.20 + category_score * 0.20 + social_score * 0.20)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    ) as combined_score
  FROM normalized_scores
  ${blindspotFilter(side)}
  ORDER BY combined_score DESC
  LIMIT ${count}
`);
  return await hydrateStories(
    db,
    topStoryIds.rows as { id: number; combined_score: number }[],
  );
}

export async function getStoryCategoryArticles({
  db,
  ignoredClusterIds,
  category,
  count,
  offset,
}: {
  db: Database;
  ignoredClusterIds: number[];
  category: CategoryKeyValue;
  count: number;
  offset?: number;
}): Promise<ArticleType[]> {
  const topStoryIds = await db.execute(sql`
  WITH provider_counts AS (
    SELECT
      ${storyArticle.storyId} as story_id,
      ${article.newsProviderKey} as provider_key,
      count(*) as provider_article_count
    FROM ${storyArticle}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    INNER JOIN ${story} ON ${story.id} = ${storyArticle.storyId}
    WHERE ${recentStoriesFilter}
    GROUP BY ${storyArticle.storyId}, ${article.newsProviderKey}
  ),

  cluster_scores AS (
    SELECT
      ${story.id} as id,
      count(${article.id}) as article_count,
      sum(${article.llmRank}) as sum_llm_rank,
      ${recencyScoreExpr} as recency_score,
      count(DISTINCT ${articleSocialPost.socialPostId}) as social_post_count,
      max(pc.provider_article_count) as max_provider_articles
    FROM ${story}
    INNER JOIN ${storyArticle} ON ${story.id} = ${storyArticle.storyId}
    INNER JOIN ${article} ON ${storyArticle.articleId} = ${article.id}
    LEFT JOIN ${articleSocialPost} ON ${article.id} = ${articleSocialPost.articleId}
    LEFT JOIN provider_counts pc ON pc.story_id = ${story.id}
    WHERE ${recentStoriesFilter}
      AND (${category} = ANY(ARRAY[${article.categories}[1], ${article.categories}[2]]))
      ${ignoredClusterIds.length > 0 ? sql`AND ${story.id} NOT IN ${ignoredClusterIds}` : sql``}
    GROUP BY ${story.id}
    HAVING count(${article.id}) > 0
  ),

  normalized_scores AS (
    SELECT
      id,
      article_count,
      recency_score,
      social_post_count,
      max_provider_articles,
      CASE
        WHEN MAX(sum_llm_rank) OVER () > 0
        THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
        ELSE 0
      END as cluster_llm_rank_score,
      CASE
        WHEN MAX(social_post_count) OVER () > 0
        THEN social_post_count::float / MAX(social_post_count) OVER ()
        ELSE 0
      END as social_score
    FROM cluster_scores
  )

  SELECT
    id,
    article_count,
    cluster_llm_rank_score,
    recency_score,
    social_score,

    (max_provider_articles::float / NULLIF(article_count, 0)) as dominance,

    (cluster_llm_rank_score * 0.45 + recency_score * 0.3 + social_score * 0.25) as base_score,

    (
      (cluster_llm_rank_score * 0.45 + recency_score * 0.3 + social_score * 0.25)
      * (1 - GREATEST(0, (max_provider_articles::float / NULLIF(article_count, 0)) - 0.4))
    ) as combined_score
  FROM normalized_scores
  ORDER BY combined_score DESC
  LIMIT ${count}
  OFFSET ${offset ?? 0}
`);

  return await hydrateStories(
    db,
    topStoryIds.rows as { id: number; combined_score: number }[],
  );
}

async function hydrateStories(
  db: Database,
  storyIds: { id: number; combined_score: number }[],
): Promise<ArticleType[]> {
  if (storyIds.length === 0) return [];

  const topStories = await db.query.story.findMany({
    where: (s, { inArray }) =>
      inArray(
        s.id,
        storyIds.map((row) => row.id),
      ),
    with: {
      storyArticles: {
        with: {
          article_articleId: {
            columns: {
              id: true,
              imageUrls: true,
              categories: true,
              publishedAt: true,
            },
            with: { newsProvider: true },
          },
        },
      },
    },
  });

  topStories.sort((a, b) => {
    const aScore = storyIds.find((row) => row.id === a.id)?.combined_score ?? 0;
    const bScore = storyIds.find((row) => row.id === b.id)?.combined_score ?? 0;
    return bScore - aScore;
  });

  return topStories.map((s) => {
    const storyArticles = s.storyArticles.map((sa) => sa.article_articleId);
    const tags = new Set(
      storyArticles
        .map((a) => a.categories)
        .filter((c) => c !== null)
        .flat(),
    );
    const providerKeys = new Set(storyArticles.map((a) => a.newsProvider.key));
    const tagList = Array.from(tags).slice(0, 3);

    return {
      id: s.id.toString(),
      title: s.title,
      image: {
        src: extractHeroImage(storyArticles),
        alt: "Placeholder Image 1", // TODO: fix this or get rid of it
      },
      tags: tagList.length > 0 ? tagList : ["politika"],
      biasDistribution: getBiasDistribution(storyArticles),
      showTags: true,
      numberOfArticles: storyArticles.length,
      providerKeys: Array.from(providerKeys),
      to: `/zgodba/${s.id}`,
      images: extractCarouselImages(storyArticles),
      lastPublishedAt: newestPublishedAt(storyArticles),
    };
  });
}

/** Hidden `/novo` homepage: same shape as the public home feed, ranked from stories. */
export async function fetchStoryHomeArticlesData({ db }: { db: Database }) {
  const homeArticles = await getStoryHomeArticles({ db, count: 6 });
  let ignoredClusterIds = homeArticles.map((a) => Number(a.id));

  const byCategory = emptyArticlesByCategory();

  for (const category of config.categories) {
    const categoryArticles = await getStoryCategoryArticles({
      db,
      ignoredClusterIds,
      count: 6,
      category: category.key,
    });

    ignoredClusterIds = [
      ...ignoredClusterIds,
      ...categoryArticles.map((a) => Number(a.id)),
    ];

    byCategory[category.key] = categoryArticles;
  }

  return {
    home: homeArticles,
    ...byCategory,
    // Searched across the whole window: one-sided stories rarely rank high.
    // A hero story can repeat here — the section answers a different question.
    blindspots: {
      left: await getStoryHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "left",
      }),
      right: await getStoryHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "right",
      }),
    },
  };
}
