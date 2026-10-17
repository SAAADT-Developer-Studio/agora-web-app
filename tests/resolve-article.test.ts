import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  chooseResolvedStory,
  classifyStoryParam,
  clusterSlugBounds,
  INT4_MAX,
  isStatementTimeout,
  MATCH_WINDOW_MS,
  parseArticleParam,
  parseInt4Id,
  persistedStoryStatus,
  pickClosestStory,
  REDIRECT_CACHE_CONTROL,
  shouldStorePageCache,
  slugifyTitle,
  storyCanonicalDecision,
  timeoutResolution,
} from "../app/lib/articleUrl.ts";
import { sitemapIdBounds } from "../app/lib/sitemapChunks.ts";

const STAMP = new Date("2026-10-17T16:13:00.000Z");

describe("run-stamp parsing", () => {
  it("keeps a digit-leading run slug off the integer branch", () => {
    const slug =
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe-2026-10-17-16-13-17";
    const parsed = parseArticleParam(slug);
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.titleSlug).toBe(
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe",
    );
    expect(parsed.runStamp?.toISOString()).toBe(STAMP.toISOString());
  });

  it("does not run title fallbacks for a slug without a run stamp", () => {
    const parsed = parseArticleParam("qa-nonexistent-story-check-2");
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.runStamp).toBe(null);
    expect(parsed.bootstrapRunId).toBe(null);
    expect(
      chooseResolvedStory({
        directStoryId: null,
        stamp: parsed.runStamp,
        titleSlug: parsed.titleSlug,
        nearby: [],
        titles: [
          {
            storyId: 9,
            at: STAMP,
            slug: parsed.titleSlug,
          },
        ],
      }),
    ).toBe(null);
  });

  it("ignores an impossible calendar date in the stamp", () => {
    const parsed = parseArticleParam("naslov-2026-99-99-99-99-1");
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.runStamp).toBe(null);
    expect(parsed.bootstrapRunId).toBe(null);
  });

  it("bounds the slug range to ±3 days for the btree", () => {
    const bounds = clusterSlugBounds("cene-goriv", STAMP);
    const onStamp = "cene-goriv-2026-10-17-16-13-523";
    const weekBefore = "cene-goriv-2026-10-10-16-13-1";
    expect(bounds.lower <= onStamp && onStamp < bounds.upper).toBe(true);
    expect(weekBefore < bounds.lower).toBe(true);
    expect(bounds.end.getTime() - bounds.start.getTime()).toBe(
      MATCH_WINDOW_MS * 2,
    );
  });
});

describe("int4 bounds", () => {
  it("accepts the int4 maximum and rejects the value above it", () => {
    expect(parseInt4Id(String(INT4_MAX))).toBe(INT4_MAX);
    expect(parseInt4Id(String(INT4_MAX + 1))).toBe(null);
    expect(parseArticleParam("99999999999").kind).toBe("invalid-id");
    expect(parseArticleParam("2147483648").kind).toBe("invalid-id");
    expect(parseArticleParam("0").kind).toBe("invalid-id");
    const max = parseArticleParam(String(INT4_MAX));
    expect(max).toEqual({
      kind: "cluster-id",
      id: INT4_MAX,
      raw: String(INT4_MAX),
    });
  });
});

describe("404 vs 410", () => {
  it("404s junk, overflow, and never-issued ids before querying", () => {
    expect(classifyStoryParam("abc")).toEqual({ type: "not-found" });
    expect(classifyStoryParam("-1")).toEqual({ type: "not-found" });
    expect(classifyStoryParam("99999999999")).toEqual({ type: "not-found" });
    expect(classifyStoryParam(undefined)).toEqual({ type: "not-found" });
  });

  it("redirects leading zeros and loads a canonical id", () => {
    expect(classifyStoryParam("07732")).toEqual({
      type: "redirect",
      id: 7732,
    });
    expect(classifyStoryParam("7732")).toEqual({ type: "load", id: 7732 });
  });

  it("410s only a story row that has no articles left", () => {
    expect(persistedStoryStatus(0)).toBe(410);
    expect(persistedStoryStatus(3)).toBe(200);
  });
});

describe("closest-date selection", () => {
  it("picks the cluster nearest the run stamp, not the newest", () => {
    const stamp = STAMP;
    const chosen = pickClosestStory(
      [
        {
          storyId: 2,
          at: new Date("2026-10-19T16:13:00.000Z"),
          weight: 20,
        },
        {
          storyId: 1,
          at: new Date("2026-10-16T16:13:00.000Z"),
          weight: 1,
        },
        {
          storyId: 3,
          at: new Date("2026-10-10T16:13:00.000Z"),
          weight: 50,
        },
      ],
      stamp,
    );
    expect(chosen).toBe(1);
  });

  it("falls through when every candidate is outside ±3 days", () => {
    expect(
      pickClosestStory(
        [{ storyId: 8, at: new Date("2026-10-10T16:13:00.000Z") }],
        STAMP,
      ),
    ).toBe(null);
  });

  it("uses a historical title inside the window and ignores a newer week", () => {
    const chosen = chooseResolvedStory({
      directStoryId: null,
      stamp: STAMP,
      titleSlug: "cene-goriv",
      nearby: [],
      titles: [
        {
          storyId: 40,
          at: new Date("2026-10-24T16:13:00.000Z"),
          slug: "cene-goriv",
        },
        {
          storyId: 41,
          at: new Date("2026-10-17T12:00:00.000Z"),
          slug: "cene-goriv",
        },
      ],
    });
    expect(chosen).toBe(41);
  });

  it("keeps a direct article-membership match", () => {
    expect(
      chooseResolvedStory({
        directStoryId: 7,
        stamp: STAMP,
        titleSlug: "cene-goriv",
        nearby: [{ storyId: 8, at: STAMP, weight: 5 }],
        titles: [],
      }),
    ).toBe(7);
  });
});

describe("statement timeout", () => {
  it("turns a Postgres statement timeout into a retryable 503", () => {
    const error = Object.assign(
      new Error("canceling statement due to statement timeout"),
      { code: "57014" },
    );
    expect(isStatementTimeout(error)).toBe(true);
    expect(isStatementTimeout({ cause: error })).toBe(true);
    expect(timeoutResolution(error)).toEqual({ kind: "unavailable" });
  });

  it("does not treat other database errors as a timeout", () => {
    expect(
      timeoutResolution(Object.assign(new Error("boom"), { code: "42P01" })),
    ).toBe(null);
  });
});

describe("bootstrap slugs", () => {
  it("maps {title}-{runId}-{index} to a cluster_run id", () => {
    const parsed = parseArticleParam("naslov-42-3");
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.titleSlug).toBe("naslov");
    expect(parsed.runStamp).toBe(null);
    expect(parsed.bootstrapRunId).toBe(42);
  });

  it("prefers a real run stamp over the bootstrap form", () => {
    const parsed = parseArticleParam(
      "zaporedje-odstopov-2026-10-17-16-13-523",
    );
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.titleSlug).toBe("zaporedje-odstopov");
    expect(parsed.runStamp?.toISOString()).toBe(STAMP.toISOString());
    expect(parsed.bootstrapRunId).toBe(null);
  });

  it("does not treat an overflowing run id as a bootstrap run", () => {
    const parsed = parseArticleParam("naslov-99999999999-1");
    expect(parsed.kind).toBe("slug");
    if (parsed.kind !== "slug") return;
    expect(parsed.bootstrapRunId).toBe(null);
    expect(parsed.runStamp).toBe(null);
  });
});

describe("single-fetch navigation", () => {
  it("loads .data and /_.data story URLs instead of redirecting", () => {
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/7279.data",
        rawId: "7279",
      }),
    ).toEqual({ type: "load", id: 7279 });
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/7279/_.data",
        rawId: "7279",
      }),
    ).toEqual({ type: "load", id: 7279 });
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/7279.data",
        rawId: "7279.data",
      }),
    ).toEqual({ type: "load", id: 7279 });
  });

  it("redirects non-canonical document paths and loads the canonical one", () => {
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/07732",
        rawId: "07732",
      }),
    ).toEqual({ type: "redirect", location: "/zgodba/7732" });
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/7732/",
        rawId: "7732",
        search: "?x=1",
      }),
    ).toEqual({ type: "redirect", location: "/zgodba/7732?x=1" });
    expect(
      storyCanonicalDecision({
        pathname: "/zgodba/7732",
        rawId: "7732",
      }),
    ).toEqual({ type: "load", id: 7732 });
  });

  it("keeps redirects and single-fetch responses out of the page cache", () => {
    expect(REDIRECT_CACHE_CONTROL.includes("max-age=300")).toBe(true);
    expect(REDIRECT_CACHE_CONTROL.includes("86400")).toBe(false);
    expect(shouldStorePageCache("/zgodba/7279.data", 200, null)).toBe(false);
    expect(shouldStorePageCache("/zgodba/7279/_.data", 202, null)).toBe(false);
    expect(
      shouldStorePageCache("/zgodba/7732", 301, REDIRECT_CACHE_CONTROL),
    ).toBe(false);
    expect(shouldStorePageCache("/slovenija/clanek/x", 301, null)).toBe(false);
    expect(shouldStorePageCache("/slovenija/clanek/x", 503, "no-store")).toBe(
      false,
    );
    expect(
      shouldStorePageCache("/zgodba/7732", 410, "public, max-age=300"),
    ).toBe(true);
  });
});

describe("sitemap id windows", () => {
  it("chunks by stable id ranges", () => {
    expect(sitemapIdBounds(1)).toEqual({
      minExclusive: 0,
      maxInclusive: 5000,
    });
    expect(sitemapIdBounds(2)).toEqual({
      minExclusive: 5000,
      maxInclusive: 10000,
    });
    expect(sitemapIdBounds(0)).toBe(null);
  });
});

describe("resolver SQL", () => {
  const resolver = readFileSync(
    new URL("../app/lib/services/resolveArticle.ts", import.meta.url),
    "utf8",
  );
  const stories = readFileSync(
    new URL("../app/lib/services/publicStories.ts", import.meta.url),
    "utf8",
  );

  it("uses the slug btree and a statement timeout only on the fallback", () => {
    expect(/\bLIKE\b/.test(resolver)).toBe(false);
    expect(resolver).toMatch(/slug\} >= \$\{bounds\.lower\}/);
    expect(resolver).toMatch(/slug\} < \$\{bounds\.upper\}/);
    expect(resolver).toMatch(/set_config\('statement_timeout'/);
    const lookup = resolver.slice(
      resolver.indexOf("export async function resolveClanekToStoryId"),
    );
    expect(
      lookup.indexOf("readExact") < lookup.indexOf("resolveFallback"),
    ).toBeTruthy();
    expect(lookup.includes("db.transaction")).toBe(false);
  });

  it("retries a missing story_summary table in a new transaction", () => {
    const lookup = resolver.slice(
      resolver.indexOf("export async function resolveClanekToStoryId"),
    );
    const firstCatch = lookup.indexOf("} catch (error) {");
    const retry = lookup.indexOf("resolveFallback(db, titleSlug, stamp, false)");
    expect(firstCatch > 0).toBeTruthy();
    expect(retry > firstCatch).toBeTruthy();
    expect(lookup).toMatch(/if \(!isUndefinedTable\(error\)\) throw error/);
    expect(lookup).toMatch(/kind: "unavailable"/);
  });

  it("prefilters title matches with the last-article index", () => {
    expect(resolver).toMatch(/lastArticlePublishedAt\} >= \$\{startIso\}/);
    expect(resolver).toMatch(/ss\.story_id = s\.id/);
  });

  it("pages sitemaps by id and filters news before aggregating", () => {
    expect(stories.includes("OFFSET")).toBe(false);
    expect(stories).toMatch(/story\.id\} > \$\{bounds\.minExclusive\}/);
    expect(stories).toMatch(/story\.id\} <= \$\{bounds\.maxInclusive\}/);
    const news = stories.slice(stories.indexOf("if (options.since)"));
    const whereAt = news.indexOf("lastArticlePublishedAt} >= ${since}");
    const groupAt = news.indexOf("GROUP BY");
    expect(whereAt > 0 && whereAt < groupAt).toBeTruthy();
  });
});

describe("clusterer slugify", () => {
  it("drops đ the way Python ascii-ignore does, and keeps decomposed letters", () => {
    expect(slugifyTitle("Međimurje")).toBe("meimurje");
    expect(slugifyTitle("Lođa in čmrlj")).toBe("loa-in-cmrlj");
    expect(slugifyTitle("čšž")).toBe("csz");
    expect(slugifyTitle("Cene goriv")).toBe("cene-goriv");
  });
});
