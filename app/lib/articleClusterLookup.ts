import { eq, sql, type SQL } from "drizzle-orm";
import { isCategoryKey } from "~/config";
import {
  article,
  articleCluster,
  clusterRun,
  clusterV2,
} from "~/drizzle/schema";
import type { Database } from "~/lib/db";

/** Postgres `integer` / int4 upper bound. Larger values must not be queried as ids. */
export const INT4_MAX = 2_147_483_647;

/**
 * Clustering runs about every 10 minutes and re-mints the live set.
 * Articles older than this are outside the clusterer's window.
 */
export const CLUSTERER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export const ARCHIVE_LABEL = "Arhiv";

export const ARCHIVE_MESSAGE =
  "Ta zgodba je arhivirana in ni več del aktualnega izbora.";

export const NEWER_CLUSTER_LABEL = "Novejša različica";

export type ArticleClusterKey =
  | { kind: "id"; id: number }
  | { kind: "slug"; slug: string };

type SelectionRow = {
  latest_run_id?: unknown;
  in_current_selection?: unknown;
};

type NewerClusterRow = {
  slug?: unknown;
  id?: unknown;
  category?: unknown;
};

export type NewerCluster = {
  id: number;
  slug: string | null;
  category: string | null;
};

/**
 * Classify a `/:category/clanek/:articleId` param.
 *
 * Only a canonical positive int4 (no leading zeros, no overflow) is a cluster
 * id. `Number.parseInt` stops at the first non-digit, so `18-tisoc-...` and
 * `2026-...` were looked up as ids and 404ed while the slug row still existed.
 */
export function parseArticleClusterKey(articleId: string): ArticleClusterKey {
  if (!/^[1-9]\d*$/.test(articleId)) {
    return { kind: "slug", slug: articleId };
  }
  const id = Number(articleId);
  if (!Number.isSafeInteger(id) || id > INT4_MAX) {
    return { kind: "slug", slug: articleId };
  }
  return { kind: "id", id };
}

/**
 * Equality on `cluster_v2.id` or `cluster_v2.slug`.
 * The clanek page must not filter by the latest run, ranking, or a time window.
 * A cluster that has left the live feed still resolves when its row exists.
 */
export function articleClusterWhere(articleId: string): SQL {
  const key = parseArticleClusterKey(articleId);
  if (key.kind === "id") return eq(clusterV2.id, key.id);
  return eq(clusterV2.slug, key.slug);
}

export async function findClusterForClanek(db: Database, articleId: string) {
  return await db.query.clusterV2.findFirst({
    where: articleClusterWhere(articleId),
    with: {
      articleClusters: {
        with: {
          article: {
            columns: {
              id: true,
              title: true,
              url: true,
              publishedAt: true,
              summary: true,
              categories: true,
              newsProviderKey: true,
              imageUrls: true,
              author: true,
              isPaywalled: true,
            },
            with: { newsProvider: true },
          },
        },
      },
    },
  });
}

function idList(ids: number[]): SQL {
  return sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
}

/**
 * Latest production run, plus whether any of this cluster's articles were
 * re-minted into that run. Equality only. No row means there is no production run.
 */
export function currentSelectionSql(articleIds: number[]): SQL {
  const inCurrentSelection =
    articleIds.length === 0
      ? sql`false`
      : sql`EXISTS (
          SELECT 1
          FROM ${articleCluster}
          WHERE ${articleCluster.runId} = latest.id
            AND ${articleCluster.articleId} IN (${idList(articleIds)})
        )`;

  return sql`
    WITH latest AS (
      SELECT ${clusterRun.id} AS id
      FROM ${clusterRun}
      WHERE ${clusterRun.isProduction} = true
      ORDER BY ${clusterRun.createdAt} DESC
      LIMIT 1
    )
    SELECT
      latest.id AS latest_run_id,
      ${inCurrentSelection} AS in_current_selection
    FROM latest
  `;
}

/** Newest other cluster that shares an article id. Equality only. */
export function newerClusterSql(input: {
  articleIds: number[];
  clusterId: number;
  createdAt: string;
}): SQL {
  return sql`
    SELECT picked.slug AS slug, picked.id AS id, cat.category AS category
    FROM (
      SELECT ${clusterV2.id} AS id, ${clusterV2.slug} AS slug
      FROM ${articleCluster}
      INNER JOIN ${clusterV2}
        ON ${clusterV2.id} = ${articleCluster.clusterId}
      WHERE ${articleCluster.articleId} IN (${idList(input.articleIds)})
        AND ${clusterV2.id} <> ${input.clusterId}
        AND ${clusterV2.createdAt} > ${input.createdAt}::timestamptz
      ORDER BY ${clusterV2.createdAt} DESC
      LIMIT 1
    ) AS picked
    LEFT JOIN LATERAL (
      SELECT ${article.categories}[1] AS category
      FROM ${articleCluster}
      INNER JOIN ${article}
        ON ${article.id} = ${articleCluster.articleId}
      WHERE ${articleCluster.clusterId} = picked.id
        AND ${article.categories}[1] IS NOT NULL
      LIMIT 1
    ) AS cat ON true
  `;
}

/** A missing or fresh timestamp stays in the window, so a null run cannot archive the site. */
export function isWithinClustererWindow(
  newestPublishedAt: Date | null,
  now: Date,
): boolean {
  if (newestPublishedAt == null || Number.isNaN(newestPublishedAt.getTime())) {
    return true;
  }
  return now.getTime() - newestPublishedAt.getTime() <= CLUSTERER_WINDOW_MS;
}

/**
 * Archived only when the newest article is outside the clusterer window and
 * the story is absent from the current production run. A null latest run,
 * the latest run itself, or articles re-minted into that run are not archived.
 */
export function isArchivedCluster(input: {
  newestPublishedAt: Date | null;
  now: Date;
  latestProductionRunId: number | null;
  inCurrentSelection: boolean;
}): boolean {
  if (isWithinClustererWindow(input.newestPublishedAt, input.now)) return false;
  if (input.latestProductionRunId == null) return false;
  if (input.inCurrentSelection) return false;
  return true;
}

/** First valid category in caller order. Pass newest articles first. */
export function clusterOwnCategory(
  articles: { categories: string[] | null }[],
): string | null {
  for (const item of articles) {
    for (const category of item.categories ?? []) {
      const key = category.toLowerCase();
      if (isCategoryKey(key)) return key;
    }
  }
  return null;
}

/** Category comes from the cluster. The article id is the one already requested. */
export function clanekPath(
  category: string | null | undefined,
  articleId: string,
): string | null {
  if (!category) return null;
  const key = category.toLowerCase();
  if (!isCategoryKey(key)) return null;
  return `/${key}/clanek/${encodeURIComponent(articleId)}`;
}

export function newerClusterPath(
  newer: NewerCluster,
  fallbackCategory: string | null,
): string | null {
  const articleId = newer.slug || String(newer.id);
  return (
    clanekPath(newer.category, articleId) ??
    clanekPath(fallbackCategory, articleId)
  );
}

function asId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
    const id = Number(value);
    if (Number.isSafeInteger(id)) return id;
  }
  return null;
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function resolveClanekArchive(
  db: Pick<Database, "execute">,
  input: {
    id: number;
    runId: number;
    createdAt: string;
    articleIds: number[];
    newestPublishedAt: Date | null;
    category: string | null;
  },
  now: Date,
): Promise<{ archived: boolean; newerClusterPath: string | null }> {
  if (isWithinClustererWindow(input.newestPublishedAt, now)) {
    return { archived: false, newerClusterPath: null };
  }

  const selectionResult = await db.execute<SelectionRow>(
    currentSelectionSql(input.articleIds),
  );
  const selection = selectionResult.rows[0];
  const latestProductionRunId = asId(selection?.latest_run_id);
  const inCurrentSelection =
    asBool(selection?.in_current_selection) ||
    (latestProductionRunId != null && latestProductionRunId === input.runId);
  const archived = isArchivedCluster({
    newestPublishedAt: input.newestPublishedAt,
    now,
    latestProductionRunId,
    inCurrentSelection,
  });
  if (!archived || input.articleIds.length === 0) {
    return { archived, newerClusterPath: null };
  }

  const newerResult = await db.execute<NewerClusterRow>(
    newerClusterSql({
      articleIds: input.articleIds,
      clusterId: input.id,
      createdAt: input.createdAt,
    }),
  );
  const newerRow = newerResult.rows[0];
  const newerId = asId(newerRow?.id);
  const newer =
    newerId == null
      ? null
      : {
          id: newerId,
          slug: asText(newerRow?.slug),
          category: asText(newerRow?.category),
        };

  return {
    archived: true,
    newerClusterPath: newer ? newerClusterPath(newer, input.category) : null,
  };
}

/** 404 only when the cluster row is missing. Archive state does not change this. */
export function clanekHttpStatus(clusterFound: boolean): 200 | 404 {
  return clusterFound ? 200 : 404;
}

/** A found cluster stays indexable, including clusters from older runs. */
export function clanekIndexing(clusterFound: boolean): { noindex: boolean } {
  return { noindex: !clusterFound };
}
