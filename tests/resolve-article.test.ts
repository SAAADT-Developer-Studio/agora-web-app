import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
  rethrowUnlessTimeout,
  slugifyTitle,
} from "../app/lib/articleUrl.ts";

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
  it("turns a Postgres statement timeout into an unresolved lookup", () => {
    const error = Object.assign(
      new Error("canceling statement due to statement timeout"),
      { code: "57014" },
    );
    assert.equal(isStatementTimeout(error), true);
    assert.equal(isStatementTimeout({ cause: error }), true);
    assert.equal(rethrowUnlessTimeout(error), null);
  });

  it("does not swallow other database errors", () => {
    assert.throws(
      () => rethrowUnlessTimeout(Object.assign(new Error("boom"), { code: "42P01" })),
      /boom/,
    );
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
