import { eq, sql, type SQL } from "drizzle-orm";
import { clusterRun, clusterV2 } from "~/drizzle/schema";

/** Postgres `integer` / int4 upper bound. Larger values must not be queried as ids. */
export const INT4_MAX = 2_147_483_647;

export const ARCHIVE_LABEL = "Arhiv";

export const ARCHIVE_MESSAGE =
  "Ta zgodba je arhivirana in ni več del aktualnega izbora.";

export type ArticleClusterKey =
  | { kind: "id"; id: number }
  | { kind: "slug"; slug: string };

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

/**
 * Latest production clustering run. This decides the archive notice only.
 * It is not part of the cluster lookup.
 */
export function latestProductionRunIdSql() {
  return sql`
    SELECT ${clusterRun.id} AS id
    FROM ${clusterRun}
    WHERE ${clusterRun.isProduction} = true
    ORDER BY ${clusterRun.createdAt} DESC
    LIMIT 1
  `;
}

export function isArchivedCluster(
  clusterRunId: number,
  latestProductionRunId: number | null,
): boolean {
  return (
    latestProductionRunId === null || clusterRunId !== latestProductionRunId
  );
}

/** 404 only when the cluster row is missing. Archive state does not change this. */
export function clanekHttpStatus(clusterFound: boolean): 200 | 404 {
  return clusterFound ? 200 : 404;
}

/** A found cluster stays indexable, including clusters from older runs. */
export function clanekIndexing(clusterFound: boolean): { noindex: boolean } {
  return { noindex: !clusterFound };
}
