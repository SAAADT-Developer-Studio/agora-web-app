import { and, eq, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { story } from "~/drizzle/schema";
import type { Database } from "~/lib/db";

/**
 * Agora adds `hidden boolean NOT NULL DEFAULT false` to `cluster_v2` and
 * `story`. This worker can deploy before that migration. Naming a missing
 * column fails the query (SQLSTATE 42703), which would take down every feed,
 * so callers ask `hiddenColumnPresent` and only then append `hidden = false`.
 *
 * Relational queries must pass `clusterV2VisibleColumns` or
 * `storyVisibleColumns`. Drizzle selects every column on the table, and a
 * SELECT of a missing `hidden` fails the same way a WHERE would.
 *
 * A missing column is rechecked on a short interval so the migration is
 * picked up without a worker restart. Once the column is visible it stays
 * visible for the life of the isolate.
 */
export const HIDDEN_COLUMN_ABSENT_RECHECK_MS = 30_000;

export type HiddenTable = "cluster_v2" | "story";

type ProbeDb = Pick<Database, "execute">;

type ProbeEntry = { present: boolean; expiresAt: number };

const probes = new Map<HiddenTable, ProbeEntry>();

export function resetHiddenColumnProbeForTests(): void {
  probes.clear();
}

/** Every `cluster_v2` column except `hidden`, so a missing column is not selected. */
export const clusterV2VisibleColumns = {
  id: true,
  title: true,
  slug: true,
  createdAt: true,
  runId: true,
  wikiImageUrls: true,
  wikiImageLookupAt: true,
  wikiImageLastAttemptAt: true,
  wikiImageMetadata: true,
  rankScore: true,
  rankedAt: true,
  rankComponents: true,
  rankVersion: true,
  rankCategory: true,
  rankingRunId: true,
} as const;

/** Every `story` column except `hidden`. */
export const storyVisibleColumns = {
  id: true,
  title: true,
  lastArticlePublishedAt: true,
  createdAt: true,
} as const;

function asPresent(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

/**
 * Drizzle addresses `cluster_v2` and `story` without a schema, so Postgres
 * resolves them through `search_path`. `to_regclass` uses that same lookup.
 * `current_schema()` would miss the column when the table lives in a later
 * schema on the path.
 *
 * Each call queries on its own until the result is cached. Sharing one
 * in-flight promise across requests is unsafe: cancelling the first request
 * can leave the others waiting on it.
 */
export async function hiddenColumnPresent(
  db: ProbeDb,
  table: HiddenTable,
  nowMs = Date.now(),
): Promise<boolean> {
  const cached = probes.get(table);
  if (cached && cached.expiresAt > nowMs) return cached.present;

  const columnName = "hidden";
  const result = await db.execute<{ present?: unknown }>(sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_attribute
      WHERE attrelid = to_regclass(${table})
        AND attname = ${columnName}
        AND attnum > 0
        AND NOT attisdropped
    ) AS present
  `);
  const present = asPresent(result.rows[0]?.present);
  probes.set(table, {
    present,
    expiresAt: present
      ? Number.POSITIVE_INFINITY
      : nowMs + HIDDEN_COLUMN_ABSENT_RECHECK_MS,
  });
  return present;
}

/**
 * ` AND <column> = false`, or nothing when the column is not there yet.
 * Nothing keeps the surrounding SQL identical to the pre-migration query.
 */
export function andHiddenIsFalse(column: PgColumn, present: boolean): SQL {
  if (!present) return sql``;
  return sql` AND ${eq(column, false)}`;
}

/** `identity`, plus `column = false` once the column exists. */
export function whereVisible(
  identity: SQL,
  column: PgColumn,
  present: boolean,
): SQL {
  if (!present) return identity;
  return and(identity, eq(column, false)) ?? identity;
}

/** `/zgodba/:storyId` lookup. Hidden and missing both fail this predicate. */
export function storyPageWhere(storyId: number, hiddenPresent: boolean): SQL {
  return whereVisible(eq(story.id, storyId), story.hidden, hiddenPresent);
}
