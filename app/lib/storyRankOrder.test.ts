import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  getCategoryCacheKey,
  HOME_CACHE_KEY,
  homeCacheKey,
  utrinkiCacheKey,
} from "~/lib/kvCache/keys";
import { CategoryKey } from "~/config";
import {
  STORY_RANK_MAX_AGE,
  STORY_RANKING_SOURCE,
  STORY_RANKING_SUCCEEDED,
  compareCoalescedRank,
  freshStoryRankingRunSql,
  observedRankFailureLabel,
  storyRankOrderEnabled,
  storyRankOrderFromEnv,
} from "~/lib/storyRankOrder";

const dialect = new PgDialect();

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return dialect.sqlToQuery(query);
}

describe("storyRankOrderEnabled", () => {
  it("turns on only for the string true", () => {
    expect(storyRankOrderEnabled("true")).toBe(true);
    for (const value of ["false", "1", "TRUE", " true", "", undefined, null]) {
      expect(storyRankOrderEnabled(value)).toBe(false);
    }
    expect(storyRankOrderFromEnv({})).toBe(false);
    expect(storyRankOrderFromEnv({ STORY_RANK_ORDER: "false" })).toBe(false);
    expect(storyRankOrderFromEnv({ STORY_RANK_ORDER: "true" })).toBe(true);
  });
});

describe("freshStoryRankingRunSql", () => {
  it("uses the latest succeeded story run inside the freshness window", () => {
    const compiled = compile(freshStoryRankingRunSql());
    expect(compiled.sql).toMatch(/from ranking_run/i);
    expect(compiled.sql).not.toMatch(/story_rank/);
    expect(compiled.sql).toContain(
      `finished_at >= now() - interval '${STORY_RANK_MAX_AGE}'`,
    );
    expect(compiled.sql).toMatch(
      /order by finished_at desc, id desc\s+limit 1/i,
    );
    expect(compiled.params).toEqual([
      STORY_RANKING_SOURCE,
      STORY_RANKING_SUCCEEDED,
    ]);
  });
});

function rankedStory(
  id: number,
  score: number,
  lastArticlePublishedAt: string | null,
) {
  return { id, score, lastArticlePublishedAt };
}

describe("compareCoalescedRank", () => {
  it("orders by score, then newer publication, then higher id", () => {
    const low = rankedStory(1, 0.2, "2026-11-21T10:00:00.000Z");
    const olderTie = rankedStory(4, 0.9, "2026-11-21T08:00:00.000Z");
    const newerTie = rankedStory(3, 0.9, "2026-11-21T09:00:00.000Z");
    const higherId = rankedStory(8, 0.9, "2026-11-21T09:00:00.000Z");
    const mid = rankedStory(2, 0.5, null);

    expect(compareCoalescedRank(higherId, newerTie)).toBeLessThan(0);
    expect(compareCoalescedRank(newerTie, olderTie)).toBeLessThan(0);
    expect(compareCoalescedRank(olderTie, mid)).toBeLessThan(0);
    expect(compareCoalescedRank(mid, low)).toBeLessThan(0);
  });

  it("treats an unscored fallback number as the sort score", () => {
    const observed = rankedStory(1, 0.3, "2026-11-21T12:00:00.000Z");
    const unscoredFallback = rankedStory(2, 0.8, "2026-11-21T12:00:00.000Z");
    expect(compareCoalescedRank(unscoredFallback, observed)).toBeLessThan(0);
  });
});

describe("observedRankFailureLabel", () => {
  it("includes the postgres code, including when it is wrapped", () => {
    expect(
      observedRankFailureLabel(
        Object.assign(new Error("permission denied for table story_rank"), {
          code: "42501",
        }),
      ),
    ).toBe("42501 permission denied for table story_rank");
    expect(observedRankFailureLabel({ cause: { code: "42703" } })).toBe(
      "42703 unknown error",
    );
    expect(observedRankFailureLabel(new Error("statement timeout"))).toBe(
      "statement timeout",
    );
  });
});

describe("listing cache keys", () => {
  it("keeps today's keys when the flag is off and separates them when it is on", () => {
    expect(homeCacheKey(false)).toBe(HOME_CACHE_KEY);
    expect(homeCacheKey(true)).toBe(`${HOME_CACHE_KEY}:observed-rank`);
    expect(getCategoryCacheKey(CategoryKey.politika)).toBe(
      "data:story:category:politika",
    );
    expect(getCategoryCacheKey(CategoryKey.politika, false)).toBe(
      "data:story:category:politika",
    );
    expect(getCategoryCacheKey(CategoryKey.politika, true)).toBe(
      "data:story:category:politika:observed-rank",
    );
    expect(utrinkiCacheKey("aktualno", 0)).toBe(
      "data:story:utrinki:v1:aktualno:0",
    );
    expect(utrinkiCacheKey("politika", 2, false)).toBe(
      "data:story:utrinki:v1:politika:2",
    );
    expect(utrinkiCacheKey("politika", 2, true)).toBe(
      "data:story:utrinki:v1:politika:2:observed-rank",
    );
  });
});
