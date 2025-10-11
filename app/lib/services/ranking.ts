import { getDb } from "~/lib/db";
import { article, cluster } from "~/drizzle/schema";
import { inArray, sql } from "drizzle-orm";
import fallbackArticleImage from "~/assets/fallback.png";
import { getBiasDistribution } from "~/utils/getBiasDistribution";

export type Image = {
  src: string;
  alt: string;
};

export type BiasDistribution = {
  leftPercent: number;
  centerPercent: number;
  rightPercent: number;
  leftCount: number;
  centerCount: number;
  rightCount: number;
  totalCount: number;
};

export type ArticleType = {
  id: string;
  title: string;
  image: Image;
  tags: string[];
  biasDistribution: BiasDistribution;
  showTags?: boolean;
  numberOfArticles: number;
  providerKeys: string[];
};

const CATEGORY_PRIORITY = {
  politika: 6,
  gospodarstvo: 6,
  kriminal: 5,
  lokalno: 5,
  "tehnologija-znanost": 4,
  sport: 2,
  kultura: 2,
  zdravje: 1,
  okolje: 1,
} as const;

const MAX_CATEGORY_PRIORITY = Math.max(...Object.values(CATEGORY_PRIORITY));

// Decay constant: articles lose ~63% relevance every 12 hours
// Formula: exp(-hours_since_publication / 12)
const RECENCY_DECAY_HOURS = 12;

const recencyScoreExpr = sql<number>`
  avg(
    exp(
      -extract(epoch from (now() - ${article.publishedAt}::timestamptz)) / 3600 / ${RECENCY_DECAY_HOURS}
    )
  )
`;

// Category score: average priority of first category across articles, normalized by max priority
const categoryScoreExpr = sql<number>`
  avg(
    CASE ${article.categories}[1]
      WHEN 'politika' THEN ${CATEGORY_PRIORITY.politika}
      WHEN 'gospodarstvo' THEN ${CATEGORY_PRIORITY.gospodarstvo}
      WHEN 'kriminal' THEN ${CATEGORY_PRIORITY.kriminal}
      WHEN 'lokalno' THEN ${CATEGORY_PRIORITY.lokalno}
      WHEN 'sport' THEN ${CATEGORY_PRIORITY.sport}
      WHEN 'tehnologija-znanost' THEN ${CATEGORY_PRIORITY["tehnologija-znanost"]}
      WHEN 'kultura' THEN ${CATEGORY_PRIORITY.kultura}
      WHEN 'zdravje' THEN ${CATEGORY_PRIORITY.zdravje}
      WHEN 'okolje' THEN ${CATEGORY_PRIORITY.okolje}
      ELSE 0
    END
  ) / ${MAX_CATEGORY_PRIORITY}
`;

export async function getHomeArticles({
  count,
}: {
  count: number;
}): Promise<ArticleType[]> {
  const db = await getDb();

  const topClusterIds = await db.execute(sql`
    WITH cluster_scores AS (
      SELECT
        ${cluster.id} as id,
        count(${article.id}) as article_count,
        sum(${article.llmRank}) as sum_llm_rank,
        ${recencyScoreExpr} as recency_score,
        ${categoryScoreExpr} as category_score
      FROM ${cluster}
      INNER JOIN ${article} ON ${cluster.id} = ${article.clusterId}
      GROUP BY ${cluster.id}
      HAVING count(${article.id}) > 0
    ),
    normalized_scores AS (
      SELECT
        id,
        article_count,
        recency_score,
        category_score,
        CASE
          WHEN MAX(sum_llm_rank) OVER () > 0
          THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
          ELSE 0
        END as cluster_llm_rank_score
      FROM cluster_scores
    )
    SELECT
      id,
      article_count,
      cluster_llm_rank_score,
      recency_score,
      category_score,
      (cluster_llm_rank_score * 0.4 + recency_score * 0.2 + category_score * 0.3) as combined_score
    FROM normalized_scores
    ORDER BY combined_score DESC
    LIMIT ${count}
  `);

  return await common(
    db,
    topClusterIds.rows as { id: number; article_count: number }[],
  );
}

export async function getCategoryArticles({
  category,
  count,
}: {
  category: string;
  count: number;
}): Promise<ArticleType[]> {
  const db = await getDb();

  // First, get the normalized scores using a subquery
  const topClusterIds = await db.execute(sql`
    WITH cluster_scores AS (
      SELECT
        ${cluster.id} as id,
        count(${article.id}) as article_count,
        sum(${article.llmRank}) as sum_llm_rank,
        ${recencyScoreExpr} as recency_score,
        ${categoryScoreExpr} as category_score
      FROM ${cluster}
      INNER JOIN ${article} ON ${cluster.id} = ${article.clusterId}
      WHERE ${category} = ${article.categories}[1]
      GROUP BY ${cluster.id}
      HAVING count(${article.id}) > 0
    ),
    normalized_scores AS (
      SELECT
        id,
        article_count,
        recency_score,
        category_score,
        CASE
          WHEN MAX(sum_llm_rank) OVER () > 0
          THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
          ELSE 0
        END as cluster_llm_rank_score
      FROM cluster_scores
    )
    SELECT
      id,
      article_count,
      cluster_llm_rank_score,
      recency_score,
      category_score,
      (cluster_llm_rank_score * 0.5 + recency_score * 0.3 + category_score * 0.2) as combined_score
    FROM normalized_scores
    ORDER BY combined_score DESC
    LIMIT ${count}
  `);

  return await common(
    db,
    topClusterIds.rows as { id: number; article_count: number }[],
  );
}

export async function getCategoryArticlesWithOffset({
  category,
  count,
  offset,
}: {
  category: string;
  count: number;
  offset: number;
}): Promise<ArticleType[]> {
  const db = await getDb();

  // First, get the normalized scores using a subquery
  const topClusterIds = await db.execute(sql`
    WITH cluster_scores AS (
      SELECT
        ${cluster.id} as id,
        count(${article.id}) as article_count,
        sum(${article.llmRank}) as sum_llm_rank,
        ${recencyScoreExpr} as recency_score,
        ${categoryScoreExpr} as category_score
      FROM ${cluster}
      INNER JOIN ${article} ON ${cluster.id} = ${article.clusterId}
      WHERE ${category} = ${article.categories}[1]
      GROUP BY ${cluster.id}
      HAVING count(${article.id}) > 0
    ),
    normalized_scores AS (
      SELECT
        id,
        article_count,
        recency_score,
        category_score,
        CASE
          WHEN MAX(sum_llm_rank) OVER () > 0
          THEN sum_llm_rank::float / MAX(sum_llm_rank) OVER ()
          ELSE 0
        END as cluster_llm_rank_score
      FROM cluster_scores
    )
    SELECT
      id,
      article_count,
      cluster_llm_rank_score,
      recency_score,
      category_score,
      (cluster_llm_rank_score * 0.5 + recency_score * 0.3 + category_score * 0.2) as combined_score
    FROM normalized_scores
    ORDER BY combined_score DESC
    LIMIT ${count}
    OFFSET ${offset}
  `);

  return await common(
    db,
    topClusterIds.rows as { id: number; article_count: number }[],
  );
}

async function common(
  db: Awaited<ReturnType<typeof getDb>>,
  clusterIds: { id: number; article_count: number }[],
) {
  const topClusters = await db.query.cluster.findMany({
    where: inArray(
      cluster.id,
      clusterIds.map((c) => c.id),
    ),
    with: {
      articles: {
        columns: { imageUrls: true, categories: true },
        with: { newsProvider: true },
      },
    },
  });
  topClusters.sort((a, b) => {
    const aCount = clusterIds.find((c) => c.id === a.id)?.article_count ?? 0;
    const bCount = clusterIds.find((c) => c.id === b.id)?.article_count ?? 0;
    return bCount - aCount;
  });

  const articles: ArticleType[] = topClusters.map((c) => {
    const imgSrc =
      c.articles.find((a) => a.imageUrls && a.imageUrls.length > 0)
        ?.imageUrls?.[0] ?? fallbackArticleImage;

    const tags = new Set(
      c.articles
        .map((a) => a.categories)
        .filter((c) => c !== null)
        .flat(),
    );

    const biasDistribution = getBiasDistribution(c.articles);

    const providerKeys = new Set(c.articles.map((a) => a.newsProvider.key));

    return {
      id: c.id.toString(),
      title: c.title,
      image: {
        src: imgSrc,
        alt: "Placeholder Image 1",
      },
      tags: Array.from(tags).slice(0, 3), // this is majorly fucked, so fix it later
      biasDistribution,
      showTags: true,
      numberOfArticles: c.articles.length,
      providerKeys: Array.from(providerKeys),
    };
  });

  return articles;
}
