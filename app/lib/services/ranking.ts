import type { Database } from "~/lib/db";
import {
  article,
  clusterV2,
  articleCluster,
  clusterRun,
} from "~/drizzle/schema";
import { sql } from "drizzle-orm";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { extractHeroImage } from "~/utils/extractHeroImage";

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
  slug?: string;
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
  db,
  count,
}: {
  db: Database;
  count: number;
}): Promise<ArticleType[]> {
  // TODO: maybe pass in clusterRunId as param?
  const topClusterIds = await db.execute(sql`
    WITH latest_run AS (
      SELECT ${clusterRun.id} as id
      FROM ${clusterRun}
      WHERE ${clusterRun.isProduction} = true
      ORDER BY ${clusterRun.createdAt} DESC
      LIMIT 1
    ),
    cluster_scores AS (
      SELECT
        ${clusterV2.id} as id,
        count(${article.id}) as article_count,
        sum(${article.llmRank}) as sum_llm_rank,
        ${recencyScoreExpr} as recency_score,
        ${categoryScoreExpr} as category_score
      FROM ${clusterV2}
      INNER JOIN ${articleCluster} ON ${clusterV2.id} = ${articleCluster.clusterId}
      INNER JOIN ${article} ON ${articleCluster.articleId} = ${article.id}
      WHERE ${articleCluster.runId} = (SELECT id FROM latest_run)
      GROUP BY ${clusterV2.id}
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
  db,
  category,
  count,
  offset,
}: {
  db: Database;
  category: string;
  count: number;
  offset?: number;
}): Promise<ArticleType[]> {
  const topClusterIds = await db.execute(sql`
    WITH latest_run AS (
      SELECT ${clusterRun.id} as id
      FROM ${clusterRun}
      WHERE ${clusterRun.isProduction} = true
      ORDER BY ${clusterRun.createdAt} DESC
      LIMIT 1
    ),
    cluster_scores AS (
      SELECT
        ${clusterV2.id} as id,
        count(${article.id}) as article_count,
        sum(${article.llmRank}) as sum_llm_rank,
        ${recencyScoreExpr} as recency_score,
        ${categoryScoreExpr} as category_score
      FROM ${clusterV2}
      INNER JOIN ${articleCluster} ON ${clusterV2.id} = ${articleCluster.clusterId}
      INNER JOIN ${article} ON ${articleCluster.articleId} = ${article.id}
      WHERE ${articleCluster.runId} = (SELECT id FROM latest_run)
        AND ${category} = ANY(${article.categories})
      GROUP BY ${clusterV2.id}
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
    OFFSET ${offset ?? 0}
  `);

  return await common(
    db,
    topClusterIds.rows as { id: number; article_count: number }[],
  );
}

async function common(
  db: Database,
  clusterIds: { id: number; article_count: number }[],
): Promise<ArticleType[]> {
  const topClusters = await db.query.clusterV2.findMany({
    where: (cluster, { and, inArray }) =>
      and(
        inArray(
          cluster.id,
          clusterIds.map((c) => c.id),
        ),
      ),
    with: {
      articleClusters: {
        with: {
          article: {
            columns: { imageUrls: true, categories: true },
            with: { newsProvider: true },
          },
        },
      },
    },
  });

  topClusters.sort((a, b) => {
    const aCount = clusterIds.find((c) => c.id === a.id)?.article_count ?? 0;
    const bCount = clusterIds.find((c) => c.id === b.id)?.article_count ?? 0;
    return bCount - aCount;
  });

  const articles: ArticleType[] = topClusters.map((c) => {
    const clusterArticles = c.articleClusters.map((ac) => ac.article);

    const imgSrc = extractHeroImage(
      clusterArticles
        .filter((a) => a.imageUrls && a.imageUrls.length > 0)
        .map((a) => {
          return {
            url: a.imageUrls![0],
            providerKey: a.newsProvider.key,
            providerRank: a.newsProvider.rank,
          };
        }),
    );

    const tags = new Set(
      clusterArticles
        .map((a) => a.categories)
        .filter((c) => c !== null)
        .flat(),
    );

    const biasDistribution = getBiasDistribution(clusterArticles);

    const providerKeys = new Set(
      clusterArticles.map((a) => a.newsProvider.key),
    );

    return {
      id: c.id.toString(),
      slug: c.slug ?? undefined,
      title: c.title,
      image: {
        src: imgSrc,
        alt: "Placeholder Image 1", // TODO: fix this or get rid of it
      },
      tags: Array.from(tags).slice(0, 3),
      biasDistribution,
      showTags: true,
      numberOfArticles: clusterArticles.length,
      providerKeys: Array.from(providerKeys),
    };
  });

  return articles;
}
