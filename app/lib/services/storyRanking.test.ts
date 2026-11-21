import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { config, CategoryKey } from "~/config";
import type { Database } from "~/lib/db";
import {
  createObservedRankSession,
  fetchHomeArticlesData,
  getStoryCategoryArticles,
  getStoryHomeArticles,
  observedStoryCategorySql,
  observedStoryHomeSql,
  resolveObservedStoryRankRun,
} from "~/lib/services/storyRanking";
import { freshStoryRankingRunSql } from "~/lib/storyRankOrder";

const dialect = new PgDialect();

function compile(query: SQL) {
  return dialect.sqlToQuery(query);
}

function executor(
  handler: (compiled: ReturnType<typeof compile>) =>
    | {
        rows: Array<Record<string, unknown>>;
      }
    | Promise<{ rows: Array<Record<string, unknown>> }>,
) {
  const calls: ReturnType<typeof compile>[] = [];
  const db = {
    async execute(query: SQL) {
      const compiled = compile(query);
      calls.push(compiled);
      return handler(compiled);
    },
  } as unknown as Database;
  return { db, calls };
}

describe("observed story ranking SQL", () => {
  it("orders home candidates by story_rank with a formula fallback and stable ties", () => {
    const compiled = compile(
      observedStoryHomeSql({ count: 6, observedRunId: 42 }),
    );
    expect(compiled.sql).toMatch(/left join story_rank/i);
    expect(compiled.sql).toMatch(/story_rank\.ranking_run_id = /i);
    expect(compiled.sql).toMatch(/"merged_into_story_id" IS NULL/);
    expect(compiled.sql).toMatch(/coalesce\(story_rank\.score, \(/i);
    expect(compiled.sql).toMatch(/ORDER BY combined_score DESC NULLS LAST/);
    expect(compiled.sql).toMatch(/"last_article_published_at" DESC/);
    expect(compiled.sql).toMatch(/"story"\."id" DESC/);
    expect(compiled.sql).not.toMatch(/rank_category/);
    expect(compiled.sql).not.toMatch(/from ranking_run/i);
    expect(compiled.sql).toContain("make_interval");
    expect(compiled.params).toContain(42);
    expect(compiled.params).toContain(6);
  });

  it("keeps the blindspot predicate when a side is set", () => {
    const blind = compile(
      observedStoryHomeSql({ count: 3, side: "left", observedRunId: 7 }),
    );
    expect(blind.sql).toMatch(/left_count/i);
    expect(blind.sql).toMatch(/where rated_count >=/i);
    const open = compile(observedStoryHomeSql({ count: 3, observedRunId: 7 }));
    expect(open.sql).not.toMatch(/where rated_count >=/i);
  });

  it("filters category membership the way the formula query does", () => {
    const compiled = compile(
      observedStoryCategorySql({
        ignoredClusterIds: [4, 9],
        category: CategoryKey.politika,
        count: 21,
        offset: 21,
        observedRunId: 42,
      }),
    );
    expect(compiled.sql).toMatch(/left join story_rank/i);
    expect(compiled.sql).toContain(
      `($4 = ANY(ARRAY["article"."categories"[1], "article"."categories"[2]]))`,
    );
    expect(compiled.sql).toMatch(/NOT IN \(\$5, \$6\)/);
    expect(compiled.sql).toMatch(/"merged_into_story_id" IS NULL/);
    expect(compiled.sql).not.toMatch(/rank_category/);
    expect(compiled.params).toEqual(
      expect.arrayContaining([CategoryKey.politika, 4, 9, 42, 21]),
    );
  });
});

describe("getStoryHomeArticles", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not read story_rank when no run is supplied", async () => {
    const { db, calls } = executor(() => ({ rows: [] }));
    await getStoryHomeArticles({ db, count: 6 });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).not.toMatch(/story_rank/);
    expect(calls[0].sql).not.toMatch(/ranking_run/);
    expect(calls[0].sql).not.toMatch(/merged_into_story_id/);
    expect(calls[0].sql).toMatch(/order by combined_score desc/i);
  });

  it("uses the observed query for a fresh run", async () => {
    const { db, calls } = executor(() => ({ rows: [] }));
    await getStoryHomeArticles({ db, count: 6, observedRunId: 42 });
    expect(calls).toEqual([
      compile(observedStoryHomeSql({ count: 6, observedRunId: 42 })),
    ]);
  });

  it("falls back to the formula when story_rank is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let attempt = 0;
    const { db, calls } = executor(() => {
      attempt += 1;
      if (attempt === 1) {
        throw Object.assign(new Error('relation "story_rank" does not exist'), {
          code: "42P01",
        });
      }
      return { rows: [] };
    });
    await getStoryHomeArticles({ db, count: 6, observedRunId: 42 });
    expect(calls[1].sql).not.toMatch(/story_rank/);
    expect(calls[1].sql).toMatch(/order by combined_score desc/i);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("falls back when story_rank rejects the role", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let attempt = 0;
    const { db, calls } = executor(() => {
      attempt += 1;
      if (attempt === 1) {
        throw Object.assign(
          new Error("permission denied for table story_rank"),
          { code: "42501" },
        );
      }
      return { rows: [] };
    });
    await expect(
      getStoryHomeArticles({ db, count: 6, observedRunId: 42 }),
    ).resolves.toEqual([]);
    expect(calls[1].sql).not.toMatch(/story_rank/);
    expect(calls[1].sql).toMatch(/order by combined_score desc/i);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/42501/);
  });

  it("falls back on a timeout and on an error without a postgres code", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const failure of [
      Object.assign(new Error("canceling statement due to statement timeout"), {
        code: "57014",
      }),
      new Error("connection reset"),
    ]) {
      let attempt = 0;
      const { db, calls } = executor(() => {
        attempt += 1;
        if (attempt === 1) throw failure;
        return { rows: [] };
      });
      await expect(
        getStoryHomeArticles({ db, count: 6, observedRunId: 42 }),
      ).resolves.toEqual([]);
      expect(calls[1].sql).toMatch(/order by combined_score desc/i);
      expect(calls[1].sql).not.toMatch(/story_rank/);
    }
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe("resolveObservedStoryRankRun", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not query when the flag is off", async () => {
    const { db, calls } = executor(() => ({ rows: [{ id: 1 }] }));
    await expect(
      resolveObservedStoryRankRun(db, false),
    ).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it("returns the latest fresh run id", async () => {
    const { db, calls } = executor(() => ({ rows: [{ id: 15 }] }));
    await expect(resolveObservedStoryRankRun(db, true)).resolves.toBe(15);
    expect(calls).toEqual([compile(freshStoryRankingRunSql())]);
  });

  it("accepts a numeric string id", async () => {
    const { db } = executor(() => ({ rows: [{ id: "15" }] }));
    await expect(resolveObservedStoryRankRun(db, true)).resolves.toBe(15);
  });

  it("falls back when no run is fresh", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = executor(() => ({ rows: [] }));
    await expect(
      resolveObservedStoryRankRun(db, true),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("falls back when ranking_run.source is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = executor(() => {
      throw Object.assign(new Error('column "source" does not exist'), {
        code: "42703",
      });
    });
    await expect(
      resolveObservedStoryRankRun(db, true),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("falls back when the role cannot read ranking_run", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = executor(() => {
      throw Object.assign(
        new Error("permission denied for table ranking_run"),
        {
          code: "42501",
        },
      );
    });
    await expect(
      resolveObservedStoryRankRun(db, true),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/42501/);
  });

  it("falls back when the lookup throws without a postgres code", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = executor(() => {
      throw new Error("connect ECONNRESET");
    });
    await expect(
      resolveObservedStoryRankRun(db, true),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("fetchHomeArticlesData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the formula queries when the flag is off", async () => {
    const { db, calls } = executor(() => ({ rows: [] }));
    await fetchHomeArticlesData({ db, storyRankOrder: false });
    expect(calls.some((call) => /story_rank|ranking_run/i.test(call.sql))).toBe(
      false,
    );
  });

  it("looks up one run and orders every section by that run", async () => {
    const { db, calls } = executor((compiled) => {
      if (/from ranking_run/i.test(compiled.sql)) return { rows: [{ id: 9 }] };
      return { rows: [] };
    });
    await fetchHomeArticlesData({ db, storyRankOrder: true });
    const runLookups = calls.filter((call) =>
      /from ranking_run/i.test(call.sql),
    );
    expect(runLookups).toHaveLength(1);
    const sections = calls.filter(
      (call) => !/from ranking_run/i.test(call.sql),
    );
    // Hero, one strip per category, and both blindspot sides.
    expect(sections).toHaveLength(1 + config.categories.length + 2);
    for (const section of sections) {
      expect(section.sql).toMatch(/left join story_rank/i);
      expect(section.params).toContain(9);
    }
  });

  it("logs a story_rank failure once and does not query it again", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db, calls } = executor((compiled) => {
      if (/from ranking_run/i.test(compiled.sql)) return { rows: [{ id: 9 }] };
      if (/story_rank/i.test(compiled.sql)) {
        throw Object.assign(
          new Error("permission denied for table story_rank"),
          { code: "42501" },
        );
      }
      return { rows: [] };
    });
    await fetchHomeArticlesData({ db, storyRankOrder: true });
    const ranked = calls.filter((call) => /story_rank/i.test(call.sql));
    const formula = calls.filter(
      (call) => !/ranking_run|story_rank/i.test(call.sql),
    );
    expect(ranked).toHaveLength(1);
    // The failed section still runs the formula, and the rest never touch story_rank.
    expect(formula).toHaveLength(1 + config.categories.length + 2);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("logs a shared session's failure once across two fetches", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rankSession = createObservedRankSession();
    const { db, calls } = executor((compiled) => {
      if (/ranking_run|story_rank/i.test(compiled.sql)) {
        throw new Error("connection reset");
      }
      return { rows: [] };
    });
    await fetchHomeArticlesData({ db, storyRankOrder: true, rankSession });
    await fetchHomeArticlesData({ db, storyRankOrder: true, rankSession });
    const ranked = calls.filter((call) =>
      /story_rank|ranking_run/i.test(call.sql),
    );
    expect(ranked).toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("uses the formula for every section when the run is stale", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db, calls } = executor((compiled) => {
      if (/from ranking_run/i.test(compiled.sql)) return { rows: [] };
      return { rows: [] };
    });
    await fetchHomeArticlesData({ db, storyRankOrder: true });
    const sections = calls.filter(
      (call) => !/from ranking_run/i.test(call.sql),
    );
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(section.sql).not.toMatch(/story_rank/);
      expect(section.sql).toMatch(/order by combined_score desc/i);
    }
  });
});

describe("getStoryCategoryArticles", () => {
  it("offsets with the observed run when one is supplied", async () => {
    const { db, calls } = executor(() => ({ rows: [] }));
    await getStoryCategoryArticles({
      db,
      ignoredClusterIds: [],
      category: CategoryKey.sport,
      count: 21,
      offset: 42,
      observedRunId: 3,
    });
    expect(calls).toEqual([
      compile(
        observedStoryCategorySql({
          ignoredClusterIds: [],
          category: CategoryKey.sport,
          count: 21,
          offset: 42,
          observedRunId: 3,
        }),
      ),
    ]);
  });
});
