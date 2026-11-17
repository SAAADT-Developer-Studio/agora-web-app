import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "~/lib/db";
import {
  findClusterForClanek,
  newerClusterCandidatesSql,
  resolveClanekArchive,
  resetNewerClusterLookupForTests,
  CLUSTERER_WINDOW_MS,
} from "~/lib/articleClusterLookup";
import {
  clusterForArticle,
  clusterMembers,
  findCluster,
  findStory,
  splitClusters,
  splitStories,
  storyForArticle,
  storyMembers,
  unmatchedCounts,
} from "~/lib/services/clusteringExplore";
import { getCategoryArticles, getHomeArticles } from "~/lib/services/ranking";
import {
  getStoryCategoryArticles,
  getStoryHomeArticles,
} from "~/lib/services/storyRanking";
import { latestRunClustersSql } from "~/routes/sitemap";
import {
  HIDDEN_COLUMN_ABSENT_RECHECK_MS,
  hiddenColumnPresent,
  resetHiddenColumnProbeForTests,
  storyPageWhere,
} from "~/lib/hiddenColumn";

const dialect = new PgDialect();

function compile(query: SQL) {
  return dialect.sqlToQuery(query);
}

function mentionsHidden(query: SQL) {
  const compiled = compile(query);
  return /hidden/i.test(compiled.sql);
}

const NOW = new Date("2026-10-17T19:15:00.000Z");
const OLD_ARTICLE_AT = new Date(NOW.getTime() - CLUSTERER_WINDOW_MS - 60_000);

beforeEach(() => {
  resetHiddenColumnProbeForTests();
  resetNewerClusterLookupForTests();
});

function scriptedDb(present: boolean) {
  const queries: SQL[] = [];
  const finds: Array<{ where?: SQL; columns?: Record<string, boolean> }> = [];
  function selectBuilder() {
    const chain = {
      from() {
        return chain;
      },
      where(condition: SQL) {
        queries.push(condition);
        return chain;
      },
      orderBy() {
        return chain;
      },
      limit() {
        return Promise.resolve([]);
      },
    };
    return chain;
  }
  const db = {
    async execute(query: SQL) {
      queries.push(query);
      const compiled = compile(query);
      if (/to_regclass/i.test(compiled.sql)) {
        return { rows: [{ present }] };
      }
      if (/cluster_scores/i.test(compiled.sql)) {
        return { rows: [{ id: 9, combined_score: 1 }] };
      }
      return { rows: [] };
    },
    select: selectBuilder,
    query: {
      clusterV2: {
        findMany: async (args: {
          where?: SQL;
          columns?: Record<string, boolean>;
        }) => {
          finds.push(args);
          return [];
        },
        findFirst: async (args: {
          where?: SQL;
          columns?: Record<string, boolean>;
        }) => {
          finds.push(args);
          return undefined;
        },
      },
      story: {
        findMany: async (args: {
          where?: SQL;
          columns?: Record<string, boolean>;
        }) => {
          finds.push(args);
          return [];
        },
        findFirst: async (args: {
          where?: SQL;
          columns?: Record<string, boolean>;
        }) => {
          finds.push(args);
          return undefined;
        },
      },
    },
  };
  return { db: db as unknown as Database, queries, finds };
}

function rankingSql(queries: SQL[]) {
  const query = queries.find((entry) =>
    /cluster_scores/i.test(compile(entry).sql),
  );
  if (!query) throw new Error("ranking query was not executed");
  return compile(query);
}

describe("hidden column probe", () => {
  it("resolves hidden through search_path without sharing an in-flight probe", async () => {
    let probes = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const db = {
      async execute(query: SQL) {
        probes += 1;
        const compiled = compile(query);
        expect(compiled.sql).toMatch(/to_regclass/i);
        expect(compiled.sql).toMatch(/pg_attribute/i);
        expect(compiled.sql).not.toMatch(/current_schema/i);
        expect(compiled.sql).not.toMatch(/cluster_v2\.hidden|"hidden"/i);
        expect(compiled.params).toEqual(
          expect.arrayContaining(["cluster_v2", "hidden"]),
        );
        await gate;
        return { rows: [{ present: false }] };
      },
    } as unknown as Database;

    const first = hiddenColumnPresent(db, "cluster_v2");
    const second = hiddenColumnPresent(db, "cluster_v2");
    release();
    await expect(Promise.all([first, second])).resolves.toEqual([false, false]);
    await expect(hiddenColumnPresent(db, "cluster_v2")).resolves.toBe(false);
    expect(probes).toBe(2);
  });

  it("rechecks a missing column and then keeps a present column for the isolate", async () => {
    let present = false;
    let probes = 0;
    const db = {
      async execute() {
        probes += 1;
        return { rows: [{ present }] };
      },
    } as unknown as Database;
    const start = 1_000;

    await expect(hiddenColumnPresent(db, "story", start)).resolves.toBe(false);
    await expect(
      hiddenColumnPresent(
        db,
        "story",
        start + HIDDEN_COLUMN_ABSENT_RECHECK_MS - 1,
      ),
    ).resolves.toBe(false);
    expect(probes).toBe(1);

    present = true;
    await expect(
      hiddenColumnPresent(db, "story", start + HIDDEN_COLUMN_ABSENT_RECHECK_MS),
    ).resolves.toBe(true);
    await expect(
      hiddenColumnPresent(
        db,
        "story",
        start + HIDDEN_COLUMN_ABSENT_RECHECK_MS + 60_000,
      ),
    ).resolves.toBe(true);
    expect(probes).toBe(2);
  });
});

describe("public cluster and story reads", () => {
  it("adds hidden = false to live cluster feeds only after the column exists", async () => {
    const missing = scriptedDb(false);
    await getHomeArticles({ db: missing.db, count: 6 });
    await getCategoryArticles({
      db: missing.db,
      ignoredClusterIds: [],
      category: "politika",
      count: 6,
    });
    for (const query of missing.queries) {
      expect(mentionsHidden(query)).toBe(false);
    }

    resetHiddenColumnProbeForTests();
    const present = scriptedDb(true);
    await getHomeArticles({ db: present.db, count: 6, side: "left" });
    await getCategoryArticles({
      db: present.db,
      ignoredClusterIds: [1],
      category: "sport",
      count: 4,
      offset: 21,
    });
    const home = rankingSql(present.queries.slice(0, 2));
    const category = rankingSql(present.queries.slice(2));
    expect(home.sql).toMatch(/"hidden" = /);
    expect(home.params).toContain(false);
    expect(category.sql).toMatch(/"hidden" = /);
    expect(category.params).toContain(false);
    expect(home.sql).toMatch(/latest_run/i);
    expect(category.sql).toMatch(/latest_run/i);
    expect(present.finds.length).toBeGreaterThan(0);
    for (const find of present.finds) {
      expect(find.columns).toBeDefined();
      expect(find.columns).not.toHaveProperty("hidden");
      expect(find.where && mentionsHidden(find.where)).toBe(true);
    }
  });

  it("adds hidden = false to story feeds only after the column exists", async () => {
    const missing = scriptedDb(false);
    await getStoryHomeArticles({ db: missing.db, count: 6 });
    await getStoryCategoryArticles({
      db: missing.db,
      ignoredClusterIds: [],
      category: "politika",
      count: 6,
    });
    for (const query of missing.queries) {
      expect(mentionsHidden(query)).toBe(false);
    }

    resetHiddenColumnProbeForTests();
    const present = scriptedDb(true);
    await getStoryHomeArticles({ db: present.db, count: 6, side: "right" });
    await getStoryCategoryArticles({
      db: present.db,
      ignoredClusterIds: [3],
      category: "kriminal",
      count: 6,
    });
    const home = rankingSql(present.queries.slice(0, 2));
    const category = rankingSql(present.queries.slice(2));
    expect(home.sql).toMatch(/"hidden" = /);
    expect(home.params).toContain(false);
    expect(category.sql).toMatch(/"hidden" = /);
    expect(category.params).toContain(false);
    expect(home.sql).not.toMatch(/cluster_v2/i);
    expect(present.finds.length).toBeGreaterThan(0);
    for (const find of present.finds) {
      expect(find.columns).toBeDefined();
      expect(find.columns).not.toHaveProperty("hidden");
      expect(find.where && mentionsHidden(find.where)).toBe(true);
    }
  });

  it("resolves a clanek as missing when that cluster is hidden", async () => {
    const missing = scriptedDb(false);
    await findClusterForClanek(missing.db, "18-tisoc-let-stare");
    expect(missing.finds[0]?.where).toBeDefined();
    expect(mentionsHidden(missing.finds[0].where!)).toBe(false);
    expect(missing.finds[0]?.columns).toBeDefined();
    expect(missing.finds[0]?.columns).not.toHaveProperty("hidden");

    resetHiddenColumnProbeForTests();
    const present = scriptedDb(true);
    const cluster = await findClusterForClanek(present.db, "523");
    expect(cluster).toEqual({ outcome: "missing" });
    const where = compile(present.finds[0].where!);
    expect(where.sql).toMatch(/"hidden" = /);
    expect(where.params).toEqual(expect.arrayContaining([523, false]));
    expect(present.finds[0]?.columns).not.toHaveProperty("hidden");

    const hiddenStory = compile(storyPageWhere(88, true));
    const visibleStory = compile(storyPageWhere(88, false));
    expect(hiddenStory.sql).toMatch(/"hidden" = /);
    expect(hiddenStory.params).toEqual(expect.arrayContaining([88, false]));
    expect(visibleStory.sql).not.toMatch(/hidden/i);
    expect(visibleStory.params).toStrictEqual([88]);
  });

  it("does not point an archived clanek at a hidden newer cluster", async () => {
    const unchanged = compile(
      newerClusterCandidatesSql({
        articleIds: [10, 11],
        clusterId: 4,
        createdAt: "2026-10-01T00:00:00.000Z",
      }),
    );
    expect(unchanged.sql).not.toMatch(/hidden/i);
    expect(unchanged.params).toStrictEqual([
      10,
      11,
      4,
      "2026-10-01T00:00:00.000Z",
    ]);

    const excluded = compile(
      newerClusterCandidatesSql({
        articleIds: [10, 11],
        clusterId: 4,
        createdAt: "2026-10-01T00:00:00.000Z",
        excludeHidden: true,
      }),
    );
    expect(excluded.sql).toMatch(/"hidden" = /);
    expect(excluded.params).toContain(false);

    const { db, queries } = scriptedDb(true);
    await resolveClanekArchive(
      db,
      {
        id: 4,
        runId: 14,
        createdAt: "2026-10-01T00:00:00.000Z",
        articleIds: [10, 11],
        newestPublishedAt: OLD_ARTICLE_AT,
        category: "politika",
      },
      NOW,
    );
    const candidates = queries.find((query) =>
      /unnest/i.test(compile(query).sql),
    );
    expect(candidates).toBeDefined();
    expect(mentionsHidden(candidates!)).toBe(true);
  });

  it("omits hidden clusters from the sitemap query only after the column exists", () => {
    const missing = compile(latestRunClustersSql(false));
    const present = compile(latestRunClustersSql(true));
    expect(missing.sql).not.toMatch(/hidden/i);
    expect(present.sql).toMatch(/"hidden" = /);
    expect(present.params).toContain(false);
    expect(present.sql).toMatch(/latest_run/i);
  });
});

describe("dev explorer reads", () => {
  it("hides clusters and stories from lookup, splits, and member joins once the column exists", async () => {
    const missing = scriptedDb(false);
    await findStory(missing.db, 7);
    await findCluster(missing.db, "7");
    await findCluster(missing.db, "nek-slug");
    await storyForArticle(missing.db, 7);
    await clusterForArticle(missing.db, 7, 3);
    await splitStories(missing.db, 3);
    await splitClusters(missing.db, 3);
    await storyMembers(missing.db, 7, 3);
    await clusterMembers(missing.db, 7, 3);
    await unmatchedCounts(missing.db, 3);
    for (const query of missing.queries) {
      expect(mentionsHidden(query)).toBe(false);
    }

    resetHiddenColumnProbeForTests();
    const present = scriptedDb(true);
    await findStory(present.db, 7);
    await findCluster(present.db, "7");
    await findCluster(present.db, "nek-slug");
    await storyForArticle(present.db, 7);
    await clusterForArticle(present.db, 7, 3);
    await splitStories(present.db, 3);
    await splitClusters(present.db, 3);
    await storyMembers(present.db, 7, 3);
    await clusterMembers(present.db, 7, 3);
    await unmatchedCounts(present.db, 3);

    const dataQueries = present.queries.filter(
      (query) => !/to_regclass/i.test(compile(query).sql),
    );
    expect(dataQueries.length).toBeGreaterThan(0);
    for (const query of dataQueries) {
      expect(compile(query).sql).toMatch(/"hidden"/);
      expect(compile(query).params).toContain(false);
    }
  });
});
