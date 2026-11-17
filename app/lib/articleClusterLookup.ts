import { eq, sql, type SQL } from "drizzle-orm";
import { isCategoryKey } from "~/config";
import {
  article,
  articleCluster,
  clusterRun,
  clusterV2,
} from "~/drizzle/schema";
import type { Database } from "~/lib/db";
import {
  andHiddenIsFalse,
  clusterV2VisibleColumns,
  hiddenColumnPresent,
  whereVisible,
} from "~/lib/hiddenColumn";

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

export const NEWER_LIVE_MESSAGE =
  "Novejša različica te zgodbe je v aktualnem izboru.";

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
  categories?: unknown;
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
 * `hidden` is applied in `findClusterForClanek`, and only after the column exists.
 */
export function articleClusterWhere(articleId: string): SQL {
  const key = parseArticleClusterKey(articleId);
  if (key.kind === "id") return eq(clusterV2.id, key.id);
  return eq(clusterV2.slug, key.slug);
}

export type ClanekLookup =
  | {
      outcome: "found";
      cluster: NonNullable<Awaited<ReturnType<typeof loadClanekCluster>>>;
    }
  | { outcome: "missing" }
  | { outcome: "hidden" }
  | { outcome: "unavailable" };

/** How long a "no hidden clusters" or per-cluster remint answer is reused. */
export const HIDDEN_REMIT_CACHE_TTL_MS = 60_000;

type TimedFlag = { present: boolean; expiresAt: number };

let anyHiddenCluster: TimedFlag | undefined;
const majorityCache = new Map<string, TimedFlag>();

export function resetHiddenRemitCacheForTests(): void {
  anyHiddenCluster = undefined;
  majorityCache.clear();
}

function loadClanekCluster(
  db: Database,
  articleId: string,
  hiddenPresent: boolean,
) {
  return db.query.clusterV2.findFirst({
    columns: clusterV2VisibleColumns,
    where: whereVisible(
      articleClusterWhere(articleId),
      clusterV2.hidden,
      hiddenPresent,
    ),
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

export function anyHiddenClusterSql(): SQL {
  return sql`
    SELECT EXISTS (
      SELECT 1 FROM ${clusterV2} WHERE ${clusterV2.hidden} = true
    ) AS any_hidden
  `;
}

export async function findClusterForClanek(
  db: Database,
  articleId: string,
): Promise<ClanekLookup> {
  const hiddenPresent = await hiddenColumnPresent(db, "cluster_v2");
  const cluster = await loadClanekCluster(db, articleId, hiddenPresent);
  if (!cluster) {
    if (!hiddenPresent) return { outcome: "missing" };
    const row = await db.query.clusterV2.findFirst({
      columns: { id: true },
      where: articleClusterWhere(articleId),
    });
    return { outcome: row ? "hidden" : "missing" };
  }
  if (!hiddenPresent) return { outcome: "found", cluster };

  // An earlier run keeps its own slug. Hide that URL when the newest remint
  // sharing a strict majority of these articles is itself hidden.
  const articleIds = [
    ...new Set(
      cluster.articleClusters.map((membership) => membership.article.id),
    ),
  ];
  if (articleIds.length === 0) return { outcome: "found", cluster };

  const covered = await newerHiddenMajority(db, {
    clusterId: cluster.id,
    createdAt: cluster.createdAt,
    articleIds,
  });
  if (covered === "unavailable") return { outcome: "unavailable" };
  if (covered) return { outcome: "hidden" };
  return { outcome: "found", cluster };
}

function majorityCacheKey(input: {
  clusterId: number;
  createdAt: string;
  articleIds: number[];
}): string {
  return `${input.clusterId}|${input.createdAt}|${[...input.articleIds].sort((a, b) => a - b).join(",")}`;
}

/**
 * `true` when the newest newer majority remint is hidden, `false` when it is
 * not (or no cluster is hidden), `"unavailable"` when the check itself failed.
 * A failure must not fall through to a cacheable 200.
 */
async function newerHiddenMajority(
  db: SqlExecutor,
  input: { clusterId: number; createdAt: string; articleIds: number[] },
): Promise<boolean | "unavailable"> {
  const nowMs = Date.now();
  const key = majorityCacheKey(input);
  const cached = majorityCache.get(key);
  if (cached && cached.expiresAt > nowMs) return cached.present;

  if (
    anyHiddenCluster &&
    anyHiddenCluster.expiresAt > nowMs &&
    !anyHiddenCluster.present
  ) {
    return false;
  }

  try {
    const anyHidden = await db.execute<{ any_hidden?: unknown }>(
      anyHiddenClusterSql(),
    );
    const row = anyHidden.rows[0];
    if (!row || !("any_hidden" in row)) return "unavailable";
    const present = asBool(row.any_hidden);
    anyHiddenCluster = {
      present,
      expiresAt: nowMs + HIDDEN_REMIT_CACHE_TTL_MS,
    };
    if (!present) return false;
  } catch (error) {
    console.warn(
      `[hidden-cluster] hidden-row probe failed for cluster ${input.clusterId}; refusing the page: ${errorSummary(error)}`,
    );
    return "unavailable";
  }

  try {
    const result = await withMajorityTransaction(db, (tx) =>
      tx.execute<{ hidden?: unknown }>(hiddenMajoritySuccessorSql(input)),
    );
    const hidden = asBool(result.rows[0]?.hidden);
    majorityCache.set(key, {
      present: hidden,
      expiresAt: nowMs + HIDDEN_REMIT_CACHE_TTL_MS,
    });
    return hidden;
  } catch (error) {
    console.warn(
      `[hidden-cluster] majority remint lookup failed for cluster ${input.clusterId}; refusing the page: ${errorSummary(error)}`,
    );
    return "unavailable";
  }
}

/** One round trip for the planner guards. `set_config(..., true)` is SET LOCAL. */
async function withMajorityTransaction<T>(
  db: SqlExecutor,
  fn: (db: SqlExecutor) => Promise<T>,
): Promise<T> {
  let finished = false;
  await db.execute(sql`BEGIN`);
  try {
    await db.execute(sql`
      SELECT
        set_config('statement_timeout', ${NEWER_CLUSTER_STATEMENT_TIMEOUT}, true),
        set_config('lock_timeout', ${NEWER_CLUSTER_LOCK_TIMEOUT}, true),
        set_config('idle_in_transaction_session_timeout', ${NEWER_CLUSTER_IDLE_IN_TRANSACTION_TIMEOUT}, true),
        set_config('join_collapse_limit', '1', true),
        set_config('from_collapse_limit', '1', true),
        set_config('enable_hashjoin', 'off', true),
        set_config('enable_mergejoin', 'off', true),
        set_config('enable_seqscan', 'off', true)
    `);
    const result = await fn(db);
    await db.execute(sql`COMMIT`);
    finished = true;
    return result;
  } finally {
    if (!finished) {
      try {
        await db.execute(sql`ROLLBACK`);
      } catch (rollbackError) {
        console.warn(
          `[hidden-cluster] rollback failed: ${errorSummary(rollbackError)}`,
        );
      }
    }
  }
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

/**
 * Hard cap for the newer-cluster lookup. `statement_timeout` cancels the
 * statement; `lock_timeout` stops waiting on a lock; `idle_in_transaction_session_timeout`
 * aborts the session if the transaction is left open. All are `SET LOCAL`.
 */
export const NEWER_CLUSTER_STATEMENT_TIMEOUT = "2000ms";
export const NEWER_CLUSTER_LOCK_TIMEOUT = "500ms";
export const NEWER_CLUSTER_IDLE_IN_TRANSACTION_TIMEOUT = "2000ms";

/** Per isolate. Extra lookups skip the link instead of queueing on Postgres. */
export const NEWER_CLUSTER_MAX_CONCURRENCY = 3;

export const NEWER_CLUSTER_CACHE_TTL_MS = 60 * 60 * 1000;
export const NEWER_CLUSTER_CACHE_MAX = 2_000;

/**
 * A cancelled request may skip `finally`, so a slot is dropped on the next
 * acquire once it is this old. Age starts at `Date.now()` when the slot is
 * taken, not at the request clock. Longer than `statement_timeout` so a live
 * lookup is not double-admitted while Postgres is still running it.
 */
export const NEWER_CLUSTER_SLOT_TTL_MS = 5_000;

type SqlExecutor = Pick<Database, "execute">;

/**
 * Newest other cluster that shares an article id.
 *
 * Join order is part of the plan. `SET LOCAL join_collapse_limit = 1` (and
 * hash/merge/seqscan discouraged) keeps it: unnest the page's article ids,
 * index-scan `uq_article_cluster_run` on `article_id`, then primary-key lookup
 * on `cluster_v2`. Do not start from `ix_cluster_v2_created_at_id` — that index
 * walks every cluster kept forever when the cutoff is old.
 * Categories are a second statement for the one picked id
 * (`ix_article_cluster_cluster_id`), not a LATERAL over the candidate join.
 */
/**
 * Newest newer cluster that shares a strict majority of this cluster's articles.
 * One row: that cluster's `hidden` flag. No row means there is no such remint.
 * Call only once `cluster_v2.hidden` exists.
 *
 * Join order matches `newerClusterCandidatesSql`: unnest the page's article ids,
 * index-scan `article_cluster` on `article_id`, then primary-key lookup on
 * `cluster_v2`. The bounded transaction keeps the planner from walking
 * `ix_cluster_v2_created_at_id`.
 */
export function hiddenMajoritySuccessorSql(input: {
  clusterId: number;
  createdAt: string;
  articleIds: number[];
}): SQL {
  return sql`
    SELECT ${clusterV2.hidden} AS hidden
    FROM unnest(ARRAY[${idList(input.articleIds)}]::int[]) AS mine(article_id)
    INNER JOIN ${articleCluster}
      ON ${articleCluster.articleId} = mine.article_id
     AND ${articleCluster.clusterId} <> ${input.clusterId}
    INNER JOIN ${clusterV2}
      ON ${clusterV2.id} = ${articleCluster.clusterId}
    WHERE (
      ${clusterV2.createdAt} > ${input.createdAt}::timestamptz
      OR (
        ${clusterV2.createdAt} = ${input.createdAt}::timestamptz
        AND ${clusterV2.id} > ${input.clusterId}
      )
    )
    GROUP BY ${clusterV2.id}, ${clusterV2.createdAt}, ${clusterV2.hidden}
    HAVING count(DISTINCT mine.article_id) * 2 > ${input.articleIds.length}
    ORDER BY ${clusterV2.createdAt} DESC, ${clusterV2.id} DESC
    LIMIT 1
  `;
}

export function newerClusterCandidatesSql(input: {
  articleIds: number[];
  clusterId: number;
  createdAt: string;
  /** Set once `cluster_v2.hidden` is known to exist. Omit it and the SQL stays unchanged. */
  excludeHidden?: boolean;
}): SQL {
  return sql`
    SELECT ${clusterV2.id} AS id, ${clusterV2.slug} AS slug
    FROM unnest(ARRAY[${idList(input.articleIds)}]::int[]) AS aid(article_id)
    INNER JOIN ${articleCluster}
      ON ${articleCluster.articleId} = aid.article_id
     AND ${articleCluster.clusterId} <> ${input.clusterId}
    INNER JOIN ${clusterV2}
      ON ${clusterV2.id} = ${articleCluster.clusterId}
    WHERE ${clusterV2.createdAt} > ${input.createdAt}::timestamptz${andHiddenIsFalse(clusterV2.hidden, input.excludeHidden === true)}
    ORDER BY ${clusterV2.createdAt} DESC, ${clusterV2.id} DESC
    LIMIT 1
  `;
}

/** Category rows for one cluster, newest article first. */
export function newerClusterCategoriesSql(clusterId: number): SQL {
  return sql`
    SELECT
      ${article.categories} AS categories,
      ${article.publishedAt} AS published_at,
      ${article.id} AS id
    FROM ${articleCluster}
    INNER JOIN ${article}
      ON ${article.id} = ${articleCluster.articleId}
    WHERE ${articleCluster.clusterId} = ${clusterId}
    ORDER BY ${article.publishedAt} DESC NULLS LAST, ${article.id} DESC
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

function asCategories(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

type CachedNewerCluster = {
  expiresAt: number;
  value: NewerCluster | null;
};

const newerClusterCache = new Map<string, CachedNewerCluster>();
const newerClusterSlots = new Map<number, number>();
let nextNewerClusterSlotId = 1;

export type NewerClusterLookup =
  | { degraded: false; cluster: NewerCluster | null }
  | { degraded: true };

export function resetNewerClusterLookupForTests(): void {
  newerClusterCache.clear();
  newerClusterSlots.clear();
  nextNewerClusterSlotId = 1;
}

function newerClusterCacheKey(input: {
  articleIds: number[];
  clusterId: number;
  createdAt: string;
  excludeHidden: boolean;
}): string {
  const articleIds = [...input.articleIds].sort((a, b) => a - b).join(",");
  return `${input.clusterId}|${input.createdAt}|${articleIds}|h${input.excludeHidden ? 1 : 0}`;
}

function readNewerClusterCache(
  key: string,
  nowMs: number,
): { hit: true; value: NewerCluster | null } | { hit: false } {
  const entry = newerClusterCache.get(key);
  if (!entry) return { hit: false };
  if (entry.expiresAt <= nowMs) {
    newerClusterCache.delete(key);
    return { hit: false };
  }
  newerClusterCache.delete(key);
  newerClusterCache.set(key, entry);
  return { hit: true, value: entry.value };
}

function writeNewerClusterCache(
  key: string,
  value: NewerCluster | null,
  nowMs: number,
): void {
  newerClusterCache.delete(key);
  newerClusterCache.set(key, {
    value,
    expiresAt: nowMs + NEWER_CLUSTER_CACHE_TTL_MS,
  });
  while (newerClusterCache.size > NEWER_CLUSTER_CACHE_MAX) {
    const oldest = newerClusterCache.keys().next().value;
    if (oldest === undefined) break;
    newerClusterCache.delete(oldest);
  }
}

function expireNewerClusterSlots(nowMs: number): void {
  for (const [id, acquiredAt] of newerClusterSlots) {
    if (nowMs - acquiredAt >= NEWER_CLUSTER_SLOT_TTL_MS) {
      newerClusterSlots.delete(id);
    }
  }
}

function acquireNewerClusterSlot(): number | null {
  const nowMs = Date.now();
  expireNewerClusterSlots(nowMs);
  if (newerClusterSlots.size >= NEWER_CLUSTER_MAX_CONCURRENCY) return null;
  const id = nextNewerClusterSlotId;
  nextNewerClusterSlotId += 1;
  newerClusterSlots.set(id, nowMs);
  return id;
}

function releaseNewerClusterSlot(id: number): void {
  newerClusterSlots.delete(id);
}

function errorSummary(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    const code = typeof record.code === "string" ? record.code : "";
    const message = typeof record.message === "string" ? record.message : "";
    if (code || message) parts.push(`${code} ${message}`.trim());
    current = record.cause;
  }
  return parts.at(-1) || parts[0] || "unknown error";
}

/**
 * BEGIN … COMMIT/ROLLBACK on this request's single pg Client.
 * `SET LOCAL` dies with the transaction, so a returned Hyperdrive connection
 * does not keep the timeout or an open transaction.
 */
async function withBoundedLookupTransaction<T>(
  db: SqlExecutor,
  fn: (db: SqlExecutor) => Promise<T>,
): Promise<T> {
  let finished = false;
  await db.execute(sql`BEGIN`);
  try {
    await db.execute(
      sql`SET LOCAL statement_timeout = '${sql.raw(NEWER_CLUSTER_STATEMENT_TIMEOUT)}'`,
    );
    await db.execute(
      sql`SET LOCAL lock_timeout = '${sql.raw(NEWER_CLUSTER_LOCK_TIMEOUT)}'`,
    );
    await db.execute(
      sql`SET LOCAL idle_in_transaction_session_timeout = '${sql.raw(NEWER_CLUSTER_IDLE_IN_TRANSACTION_TIMEOUT)}'`,
    );
    await db.execute(sql`SET LOCAL join_collapse_limit = 1`);
    await db.execute(sql`SET LOCAL from_collapse_limit = 1`);
    await db.execute(sql`SET LOCAL enable_hashjoin = off`);
    await db.execute(sql`SET LOCAL enable_mergejoin = off`);
    await db.execute(sql`SET LOCAL enable_seqscan = off`);
    const result = await fn(db);
    await db.execute(sql`COMMIT`);
    finished = true;
    return result;
  } finally {
    if (!finished) {
      try {
        await db.execute(sql`ROLLBACK`);
      } catch (rollbackError) {
        console.warn(
          `[newer-cluster] rollback failed: ${errorSummary(rollbackError)}`,
        );
      }
    }
  }
}

async function queryNewerCluster(
  db: SqlExecutor,
  input: {
    articleIds: number[];
    clusterId: number;
    createdAt: string;
    excludeHidden: boolean;
  },
): Promise<NewerCluster | null> {
  const candidates = await db.execute<NewerClusterRow>(
    newerClusterCandidatesSql(input),
  );
  const picked = candidates.rows[0];
  const id = asId(picked?.id);
  if (id == null) return null;

  const categories = await db.execute<{ categories?: unknown }>(
    newerClusterCategoriesSql(id),
  );
  return {
    id,
    slug: asText(picked?.slug),
    category: clusterOwnCategory(
      categories.rows.map((row) => ({
        categories: asCategories(row.categories),
      })),
    ),
  };
}

async function lookupNewerCluster(
  db: SqlExecutor,
  input: { articleIds: number[]; clusterId: number; createdAt: string },
  nowMs: number,
): Promise<NewerClusterLookup> {
  let excludeHidden = false;
  try {
    excludeHidden = await hiddenColumnPresent(db, "cluster_v2");
  } catch (error) {
    console.warn(
      `[newer-cluster] hidden-column probe failed for cluster ${input.clusterId}; skipping newer link: ${errorSummary(error)}`,
    );
    return { degraded: true };
  }

  const key = newerClusterCacheKey({ ...input, excludeHidden });
  const cached = readNewerClusterCache(key, nowMs);
  if (cached.hit) return { degraded: false, cluster: cached.value };

  const slot = acquireNewerClusterSlot();
  if (slot == null) {
    console.warn(
      `[newer-cluster] saturated (${NEWER_CLUSTER_MAX_CONCURRENCY} in flight); skipping newer link for cluster ${input.clusterId}`,
    );
    return { degraded: true };
  }

  try {
    const cluster = await withBoundedLookupTransaction(db, (tx) =>
      queryNewerCluster(tx, { ...input, excludeHidden }),
    );
    writeNewerClusterCache(key, cluster, nowMs);
    return { degraded: false, cluster };
  } catch (error) {
    console.warn(
      `[newer-cluster] lookup failed for cluster ${input.clusterId}; rendering without newer link: ${errorSummary(error)}`,
    );
    return { degraded: true };
  } finally {
    releaseNewerClusterSlot(slot);
  }
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
): Promise<{
  archived: boolean;
  newerClusterPath: string | null;
  newerClusterDegraded: boolean;
}> {
  if (isWithinClustererWindow(input.newestPublishedAt, now)) {
    return {
      archived: false,
      newerClusterPath: null,
      newerClusterDegraded: false,
    };
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
  if (input.articleIds.length === 0) {
    return { archived, newerClusterPath: null, newerClusterDegraded: false };
  }

  const newer = await lookupNewerCluster(
    db,
    {
      articleIds: input.articleIds,
      clusterId: input.id,
      createdAt: input.createdAt,
    },
    now.getTime(),
  );
  if (newer.degraded) {
    return { archived, newerClusterPath: null, newerClusterDegraded: true };
  }

  return {
    archived,
    newerClusterPath: newer.cluster
      ? newerClusterPath(newer.cluster, input.category)
      : null,
    newerClusterDegraded: false,
  };
}

/** 404 only when the cluster row is missing. Archive state does not change this. */
export function clanekHttpStatus(clusterFound: boolean): 200 | 404 {
  return clusterFound ? 200 : 404;
}

/**
 * A settled archive can sit in the page cache for an hour.
 * A degraded lookup (timeout, error, or a full isolate) is cached for 10
 * seconds with no stale-while-revalidate, so a hot page is not recomputed on
 * every hit and a recovered lookup replaces it quickly.
 */
export function clanekCacheControl(
  archived: boolean,
  degraded = false,
): string {
  if (degraded) return "public, max-age=10, s-maxage=10";
  if (archived) {
    return "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";
  }
  return "max-age=10, s-maxage=10";
}

/** A found cluster stays indexable, including clusters from older runs. */
export function clanekIndexing(clusterFound: boolean): { noindex: boolean } {
  return { noindex: !clusterFound };
}
