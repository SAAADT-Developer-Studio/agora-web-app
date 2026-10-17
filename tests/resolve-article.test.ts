import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
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
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(
      parsed.titleSlug,
      "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe",
    );
    assert.equal(parsed.runStamp?.toISOString(), STAMP.toISOString());
  });

  it("does not run title fallbacks for a slug without a run stamp", () => {
    const parsed = parseArticleParam("qa-nonexistent-story-check-2");
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.runStamp, null);
    assert.equal(parsed.bootstrapRunId, null);
    assert.equal(
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
      null,
    );
  });

  it("ignores an impossible calendar date in the stamp", () => {
    const parsed = parseArticleParam("naslov-2026-99-99-99-99-1");
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.runStamp, null);
    assert.equal(parsed.bootstrapRunId, null);
  });

  it("bounds the slug range to ±3 days for the btree", () => {
    const bounds = clusterSlugBounds("cene-goriv", STAMP);
    const onStamp = "cene-goriv-2026-10-17-16-13-523";
    const weekBefore = "cene-goriv-2026-10-10-16-13-1";
    assert.equal(bounds.lower <= onStamp && onStamp < bounds.upper, true);
    assert.equal(weekBefore < bounds.lower, true);
    assert.equal(bounds.end.getTime() - bounds.start.getTime(), MATCH_WINDOW_MS * 2);
  });
});

describe("int4 bounds", () => {
  it("accepts the int4 maximum and rejects the value above it", () => {
    assert.equal(parseInt4Id(String(INT4_MAX)), INT4_MAX);
    assert.equal(parseInt4Id(String(INT4_MAX + 1)), null);
    assert.equal(parseArticleParam("99999999999").kind, "invalid-id");
    assert.equal(parseArticleParam("2147483648").kind, "invalid-id");
    assert.equal(parseArticleParam("0").kind, "invalid-id");
    const max = parseArticleParam(String(INT4_MAX));
    assert.deepEqual(max, {
      kind: "cluster-id",
      id: INT4_MAX,
      raw: String(INT4_MAX),
    });
  });
});

describe("404 vs 410", () => {
  it("404s junk, overflow, and never-issued ids before querying", () => {
    assert.deepEqual(classifyStoryParam("abc"), { type: "not-found" });
    assert.deepEqual(classifyStoryParam("-1"), { type: "not-found" });
    assert.deepEqual(classifyStoryParam("99999999999"), { type: "not-found" });
    assert.deepEqual(classifyStoryParam(undefined), { type: "not-found" });
  });

  it("redirects leading zeros and loads a canonical id", () => {
    assert.deepEqual(classifyStoryParam("07732"), {
      type: "redirect",
      id: 7732,
    });
    assert.deepEqual(classifyStoryParam("7732"), { type: "load", id: 7732 });
  });

  it("410s only a story row that has no articles left", () => {
    assert.equal(persistedStoryStatus(0), 410);
    assert.equal(persistedStoryStatus(3), 200);
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
    assert.equal(chosen, 1);
  });

  it("falls through when every candidate is outside ±3 days", () => {
    assert.equal(
      pickClosestStory(
        [{ storyId: 8, at: new Date("2026-10-10T16:13:00.000Z") }],
        STAMP,
      ),
      null,
    );
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
    assert.equal(chosen, 41);
  });

  it("keeps a direct article-membership match", () => {
    assert.equal(
      chooseResolvedStory({
        directStoryId: 7,
        stamp: STAMP,
        titleSlug: "cene-goriv",
        nearby: [{ storyId: 8, at: STAMP, weight: 5 }],
        titles: [],
      }),
      7,
    );
  });
});

describe("statement timeout", () => {
  it("turns a Postgres statement timeout into a retryable 503", () => {
    const error = Object.assign(
      new Error("canceling statement due to statement timeout"),
      { code: "57014" },
    );
    assert.equal(isStatementTimeout(error), true);
    assert.equal(isStatementTimeout({ cause: error }), true);
    assert.deepEqual(timeoutResolution(error), { kind: "unavailable" });
  });

  it("does not treat other database errors as a timeout", () => {
    assert.equal(
      timeoutResolution(Object.assign(new Error("boom"), { code: "42P01" })),
      null,
    );
  });
});

describe("bootstrap slugs", () => {
  it("maps {title}-{runId}-{index} to a cluster_run id", () => {
    const parsed = parseArticleParam("naslov-42-3");
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.titleSlug, "naslov");
    assert.equal(parsed.runStamp, null);
    assert.equal(parsed.bootstrapRunId, 42);
  });

  it("prefers a real run stamp over the bootstrap form", () => {
    const parsed = parseArticleParam(
      "zaporedje-odstopov-2026-10-17-16-13-523",
    );
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.titleSlug, "zaporedje-odstopov");
    assert.equal(parsed.runStamp?.toISOString(), STAMP.toISOString());
    assert.equal(parsed.bootstrapRunId, null);
  });

  it("does not treat an overflowing run id as a bootstrap run", () => {
    const parsed = parseArticleParam("naslov-99999999999-1");
    assert.equal(parsed.kind, "slug");
    if (parsed.kind !== "slug") return;
    assert.equal(parsed.bootstrapRunId, null);
    assert.equal(parsed.runStamp, null);
  });
});

describe("single-fetch navigation", () => {
  it("loads .data and /_.data story URLs instead of redirecting", () => {
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/7279.data",
        rawId: "7279",
      }),
      { type: "load", id: 7279 },
    );
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/7279/_.data",
        rawId: "7279",
      }),
      { type: "load", id: 7279 },
    );
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/7279.data",
        rawId: "7279.data",
      }),
      { type: "load", id: 7279 },
    );
  });

  it("redirects non-canonical document paths and loads the canonical one", () => {
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/07732",
        rawId: "07732",
      }),
      { type: "redirect", location: "/zgodba/7732" },
    );
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/7732/",
        rawId: "7732",
        search: "?x=1",
      }),
      { type: "redirect", location: "/zgodba/7732?x=1" },
    );
    assert.deepEqual(
      storyCanonicalDecision({
        pathname: "/zgodba/7732",
        rawId: "7732",
      }),
      { type: "load", id: 7732 },
    );
  });

  it("keeps redirects and single-fetch responses out of the page cache", () => {
    assert.equal(REDIRECT_CACHE_CONTROL.includes("max-age=300"), true);
    assert.equal(REDIRECT_CACHE_CONTROL.includes("86400"), false);
    assert.equal(shouldStorePageCache("/zgodba/7279.data", 200, null), false);
    assert.equal(shouldStorePageCache("/zgodba/7279/_.data", 202, null), false);
    assert.equal(
      shouldStorePageCache("/zgodba/7732", 301, REDIRECT_CACHE_CONTROL),
      false,
    );
    assert.equal(shouldStorePageCache("/slovenija/clanek/x", 301, null), false);
    assert.equal(
      shouldStorePageCache("/slovenija/clanek/x", 503, "no-store"),
      false,
    );
    assert.equal(
      shouldStorePageCache("/zgodba/7732", 410, "public, max-age=300"),
      true,
    );
  });
});

describe("sitemap id windows", () => {
  it("chunks by stable id ranges", () => {
    assert.deepEqual(sitemapIdBounds(1), {
      minExclusive: 0,
      maxInclusive: 5000,
    });
    assert.deepEqual(sitemapIdBounds(2), {
      minExclusive: 5000,
      maxInclusive: 10000,
    });
    assert.equal(sitemapIdBounds(0), null);
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
    assert.equal(/\bLIKE\b/.test(resolver), false);
    assert.match(resolver, /slug\} >= \$\{bounds\.lower\}/);
    assert.match(resolver, /slug\} < \$\{bounds\.upper\}/);
    assert.match(resolver, /set_config\('statement_timeout'/);
    const lookup = resolver.slice(
      resolver.indexOf("export async function resolveClanekToStoryId"),
    );
    assert.ok(lookup.indexOf("readExact") < lookup.indexOf("resolveFallback"));
    assert.equal(lookup.includes("db.transaction"), false);
  });

  it("retries a missing story_summary table in a new transaction", () => {
    const lookup = resolver.slice(
      resolver.indexOf("export async function resolveClanekToStoryId"),
    );
    const firstCatch = lookup.indexOf("} catch (error) {");
    const retry = lookup.indexOf("resolveFallback(db, titleSlug, stamp, false)");
    assert.ok(firstCatch > 0);
    assert.ok(retry > firstCatch);
    assert.match(lookup, /if \(!isUndefinedTable\(error\)\) throw error/);
    assert.match(lookup, /kind: "unavailable"/);
  });

  it("prefilters title matches with the last-article index", () => {
    assert.match(resolver, /lastArticlePublishedAt\} >= \$\{startIso\}/);
    assert.match(resolver, /ss\.story_id = s\.id/);
  });

  it("pages sitemaps by id and filters news before aggregating", () => {
    assert.equal(stories.includes("OFFSET"), false);
    assert.match(stories, /story\.id\} > \$\{bounds\.minExclusive\}/);
    assert.match(stories, /story\.id\} <= \$\{bounds\.maxInclusive\}/);
    const news = stories.slice(stories.indexOf("if (options.since)"));
    const whereAt = news.indexOf("lastArticlePublishedAt} >= ${since}");
    const groupAt = news.indexOf("GROUP BY");
    assert.ok(whereAt > 0 && whereAt < groupAt);
  });
});

describe("clusterer slugify", () => {
  it("drops đ the way Python ascii-ignore does, and keeps decomposed letters", () => {
    assert.equal(slugifyTitle("Međimurje"), "meimurje");
    assert.equal(slugifyTitle("Lođa in čmrlj"), "loa-in-cmrlj");
    assert.equal(slugifyTitle("čšž"), "csz");
    assert.equal(slugifyTitle("Cene goriv"), "cene-goriv");
  });
});
