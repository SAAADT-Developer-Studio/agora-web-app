import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArchiveNotice, NewerCopyNotice } from "~/components/archive-notice";
import type { Database } from "~/lib/db";
import {
  ARCHIVE_LABEL,
  ARCHIVE_MESSAGE,
  CLUSTERER_WINDOW_MS,
  INT4_MAX,
  NEWER_CLUSTER_IDLE_IN_TRANSACTION_TIMEOUT,
  NEWER_CLUSTER_LABEL,
  NEWER_CLUSTER_LOCK_TIMEOUT,
  NEWER_CLUSTER_SLOT_TTL_MS,
  NEWER_CLUSTER_STATEMENT_TIMEOUT,
  NEWER_LIVE_MESSAGE,
  articleClusterWhere,
  clanekCacheControl,
  clanekHttpStatus,
  clanekIndexing,
  clanekPath,
  clusterOwnCategory,
  findClusterForClanek,
  isArchivedCluster,
  isWithinClustererWindow,
  newerClusterCandidatesSql,
  newerClusterCategoriesSql,
  newerClusterPath,
  resetNewerClusterLookupForTests,
  resolveClanekArchive,
  parseArticleClusterKey,
} from "~/lib/articleClusterLookup";
import { shouldStorePageCache } from "~/lib/pageCache";
import { getSeoMetas, SITE_URL } from "~/lib/seo";

const DIGIT_SLUG =
  "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe-2026-10-17-16-13-17";
const TIMESTAMP_SLUG = "zaporedje-odstopov-2026-10-17-16-13-523";
const NOW = new Date("2026-10-17T19:15:00.000Z");
const REMINTED_AT = new Date("2026-10-17T19:04:00.000Z");
const OLD_ARTICLE_AT = new Date(NOW.getTime() - CLUSTERER_WINDOW_MS - 60_000);

const dialect = new PgDialect();

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return dialect.sqlToQuery(query);
}

function publishedAtMillis(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function executorDb(
  execute: (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>,
) {
  return { execute } as unknown as Database;
}

type SqlKind =
  | "begin"
  | "commit"
  | "rollback"
  | "set"
  | "selection"
  | "candidates"
  | "categories"
  | "other";

function sqlKind(text: string): SqlKind {
  const trimmed = text.trim();
  if (/^begin\b/i.test(trimmed)) return "begin";
  if (/^commit\b/i.test(trimmed)) return "commit";
  if (/^rollback\b/i.test(trimmed)) return "rollback";
  if (/^set\s+local\b/i.test(trimmed)) return "set";
  if (/is_production/i.test(text)) return "selection";
  if (/unnest/i.test(text)) return "candidates";
  if (/published_at/i.test(text)) return "categories";
  return "other";
}

function lookupDb(script: {
  selection?: Array<Record<string, unknown>>;
  candidates?: Array<Record<string, unknown>>;
  categories?: Array<Record<string, unknown>>;
  failAt?: "candidates" | "categories";
  onCandidates?: () => Promise<void> | void;
}) {
  const statements: ReturnType<typeof compile>[] = [];
  let open = false;
  const db = {
    async execute(query: SQL) {
      const compiled = compile(query);
      statements.push(compiled);
      const kind = sqlKind(compiled.sql);
      if (kind === "begin") {
        open = true;
        return { rows: [] };
      }
      if (kind === "commit" || kind === "rollback") {
        open = false;
        return { rows: [] };
      }
      if (kind === "set") return { rows: [] };
      if (kind === "selection") return { rows: script.selection ?? [] };
      if (kind === "candidates") {
        await script.onCandidates?.();
        if (script.failAt === "candidates") {
          const error = new Error(
            "canceling statement due to statement timeout",
          );
          (error as { code?: string }).code = "57014";
          throw error;
        }
        return { rows: script.candidates ?? [] };
      }
      if (kind === "categories") {
        if (script.failAt === "categories")
          throw new Error("categories failed");
        return { rows: script.categories ?? [] };
      }
      throw new Error(`unexpected sql: ${compiled.sql}`);
    },
  };
  return {
    db: db as unknown as Database,
    statements,
    isOpen: () => open,
    kinds: () => statements.map((statement) => sqlKind(statement.sql)),
  };
}

describe("parseArticleClusterKey", () => {
  it("keeps a digit-leading run slug on the slug path", () => {
    expect(parseArticleClusterKey(DIGIT_SLUG)).toStrictEqual({
      kind: "slug",
      slug: DIGIT_SLUG,
    });
  });

  it("does not treat a timestamp-shaped slug as cluster id 2026", () => {
    expect(parseArticleClusterKey(TIMESTAMP_SLUG)).toStrictEqual({
      kind: "slug",
      slug: TIMESTAMP_SLUG,
    });
    const yearSlug = "2026-odstopi-vlade-2026-10-17-16-13-1";
    expect(parseArticleClusterKey(yearSlug)).toStrictEqual({
      kind: "slug",
      slug: yearSlug,
    });
  });

  it("looks up an all-digit legacy cluster id", () => {
    expect(parseArticleClusterKey("523")).toStrictEqual({
      kind: "id",
      id: 523,
    });
  });

  it("does not parse a leading-zero string into an id", () => {
    expect(parseArticleClusterKey("007")).toStrictEqual({
      kind: "slug",
      slug: "007",
    });
  });

  it("does not query an int4 overflow as an id", () => {
    expect(parseArticleClusterKey(String(INT4_MAX))).toStrictEqual({
      kind: "id",
      id: INT4_MAX,
    });
    expect(parseArticleClusterKey(String(INT4_MAX + 1))).toStrictEqual({
      kind: "slug",
      slug: String(INT4_MAX + 1),
    });
    expect(parseArticleClusterKey("99999999999")).toStrictEqual({
      kind: "slug",
      slug: "99999999999",
    });
  });
});

describe("article cluster lookup sql", () => {
  it("uses exact slug equality for a digit-leading slug", () => {
    const compiled = compile(articleClusterWhere(DIGIT_SLUG));
    const asId = compile(articleClusterWhere("18"));

    expect(compiled.params).toStrictEqual([DIGIT_SLUG]);
    expect(compiled.params).not.toStrictEqual(asId.params);
    expect(compiled.sql).toMatch(/slug.*=/);
    expect(compiled.sql).not.toMatch(/\blike\b/i);
    expect(compiled.sql).not.toMatch(/interval/i);
    expect(compiled.sql).not.toMatch(/run_id/i);
    expect(compiled.sql).not.toMatch(/latest_run/i);
    expect(compiled.sql).not.toMatch(/created_at/i);
  });

  it("uses exact id equality for an all-digit param", () => {
    const compiled = compile(articleClusterWhere("523"));
    expect(compiled.params).toStrictEqual([523]);
    expect(compiled.sql).toMatch(/"id"/);
    expect(compiled.sql).not.toMatch(/slug/i);
    expect(compiled.sql).not.toMatch(/\blike\b/i);
  });
});

describe("findClusterForClanek", () => {
  it("looks up a digit-leading slug and does not query selection on a miss", async () => {
    let where: SQL | undefined;
    let executed = 0;
    const db = {
      query: {
        clusterV2: {
          findFirst: async (args: { where: SQL }) => {
            where = args.where;
            return undefined;
          },
        },
      },
      execute: async () => {
        executed += 1;
        return { rows: [] };
      },
    } as unknown as Database;

    const cluster = await findClusterForClanek(db, DIGIT_SLUG);

    expect(cluster).toBeUndefined();
    expect(executed).toBe(0);
    expect(compile(where!).params).toStrictEqual([DIGIT_SLUG]);
    expect(compile(where!).sql).not.toMatch(/\blike\b/i);
  });
});

describe("archived clanek pages", () => {
  const oldInput = {
    id: 4,
    runId: 14,
    createdAt: "2026-10-01T00:00:00.000Z",
    articleIds: [10, 11],
    newestPublishedAt: OLD_ARTICLE_AT,
    category: "politika",
  };

  beforeEach(() => {
    resetNewerClusterLookupForTests();
  });

  it("keeps a story inside the clusterer window, including a run re-minted minutes later", () => {
    expect(isWithinClustererWindow(REMINTED_AT, NOW)).toBe(true);
    expect(
      isArchivedCluster({
        newestPublishedAt: REMINTED_AT,
        now: NOW,
        latestProductionRunId: 15,
        inCurrentSelection: false,
      }),
    ).toBe(false);
  });

  it("does not archive when the latest run is missing or the articles are still selected", () => {
    expect(
      isArchivedCluster({
        newestPublishedAt: OLD_ARTICLE_AT,
        now: NOW,
        latestProductionRunId: null,
        inCurrentSelection: false,
      }),
    ).toBe(false);
    expect(
      isArchivedCluster({
        newestPublishedAt: OLD_ARTICLE_AT,
        now: NOW,
        latestProductionRunId: 15,
        inCurrentSelection: true,
      }),
    ).toBe(false);
    expect(
      isArchivedCluster({
        newestPublishedAt: OLD_ARTICLE_AT,
        now: NOW,
        latestProductionRunId: 15,
        inCurrentSelection: false,
      }),
    ).toBe(true);
  });

  it("does not query selection for a cluster that is still in the window", async () => {
    let executed = 0;
    const result = await resolveClanekArchive(
      executorDb(async () => {
        executed += 1;
        return { rows: [] };
      }),
      { ...oldInput, newestPublishedAt: REMINTED_AT },
      NOW,
    );

    expect(result).toStrictEqual({
      archived: false,
      newerClusterPath: null,
      newerClusterDegraded: false,
    });
    expect(executed).toBe(0);
  });

  it("links an old page whose articles are still live, without the archive notice", async () => {
    const lookup = lookupDb({
      selection: [{ latest_run_id: 20, in_current_selection: true }],
      candidates: [{ slug: "nina-pecar-ziva", id: 48378536 }],
      categories: [
        { categories: ["loklano", "kriminal"], id: 2 },
        { categories: ["politika"], id: 1 },
      ],
    });
    const result = await resolveClanekArchive(
      lookup.db,
      { ...oldInput, category: "sport" },
      NOW,
    );

    expect(result).toStrictEqual({
      archived: false,
      newerClusterPath: "/kriminal/clanek/nina-pecar-ziva",
      newerClusterDegraded: false,
    });
    const selection = lookup.statements.find(
      (query) => sqlKind(query.sql) === "selection",
    );
    const categories = lookup.statements.find(
      (query) => sqlKind(query.sql) === "categories",
    );
    expect(selection?.params).toStrictEqual(expect.arrayContaining([10, 11]));
    expect(selection?.sql).toMatch(/is_production/i);
    expect(categories?.sql).toMatch(/published_at/i);
    expect(categories?.sql).toMatch(/order by/i);
    expect(categories?.params).toStrictEqual([48378536]);
    expect(lookup.kinds()).toContain("commit");
    expect(lookup.kinds()).not.toContain("rollback");
    expect(lookup.isOpen()).toBe(false);
    expect(
      lookup.statements.every((query) => !/\blike\b/i.test(query.sql)),
    ).toBe(true);

    const html = renderToStaticMarkup(
      createElement(NewerCopyNotice, {
        newerTo: "/kriminal/clanek/nina-pecar-ziva",
      }),
    );
    expect(html).toContain(NEWER_LIVE_MESSAGE);
    expect(html).toContain('href="/kriminal/clanek/nina-pecar-ziva"');
    expect(html).not.toContain(ARCHIVE_LABEL);
    expect(html).not.toContain(ARCHIVE_MESSAGE);
  });

  it("does not archive the cluster from the latest run itself", async () => {
    const lookup = lookupDb({
      selection: [{ latest_run_id: 14, in_current_selection: false }],
      candidates: [],
    });
    const result = await resolveClanekArchive(lookup.db, oldInput, NOW);

    expect(result.archived).toBe(false);
    expect(result.newerClusterPath).toBeNull();
    expect(lookup.kinds()).toContain("candidates");
    expect(lookup.kinds()).not.toContain("categories");
    expect(lookup.isOpen()).toBe(false);
  });

  it("does not archive when the latest-run query returns no row", async () => {
    const lookup = lookupDb({});
    const result = await resolveClanekArchive(lookup.db, oldInput, NOW);

    expect(result.archived).toBe(false);
    expect(result.newerClusterPath).toBeNull();
    expect(lookup.kinds()).toContain("commit");
    expect(lookup.isOpen()).toBe(false);
  });

  it("archives an old cluster outside the current selection and links a newer copy", async () => {
    const lookup = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "novejsa-zgodba", id: 99 }],
      categories: [{ categories: ["politika"], id: 3 }],
    });
    const result = await resolveClanekArchive(
      lookup.db,
      { ...oldInput, runId: 14 },
      NOW,
    );

    expect(result).toStrictEqual({
      archived: true,
      newerClusterPath: "/politika/clanek/novejsa-zgodba",
      newerClusterDegraded: false,
    });
    expect(
      lookup.statements.every((query) => !/\blike\b/i.test(query.sql)),
    ).toBe(true);
    expect(lookup.isOpen()).toBe(false);
  });

  it("returns 200 when the row exists and 404 only when it does not", () => {
    expect(clanekHttpStatus(true)).toBe(200);
    expect(clanekHttpStatus(false)).toBe(404);
  });

  it("stays indexable and canonicalizes to the cluster category", () => {
    expect(
      clusterOwnCategory([
        { categories: ["sport"] },
        { categories: ["politika"] },
      ]),
    ).toBe("sport");
    const pathname = clanekPath("politika", TIMESTAMP_SLUG);
    expect(pathname).toBe(`/politika/clanek/${TIMESTAMP_SLUG}`);
    expect(clanekIndexing(true)).toStrictEqual({ noindex: false });
    expect(clanekIndexing(false)).toStrictEqual({ noindex: true });

    const metas = getSeoMetas({
      title: "Naslov | Vidik",
      description: "Opis",
      pathname: pathname ?? "/",
      noindex: clanekIndexing(true).noindex,
    });
    const robots = metas.find(
      (meta) => "name" in meta && meta.name === "robots",
    );
    const canonical = metas.find(
      (meta) => "rel" in meta && meta.rel === "canonical",
    );

    expect(robots).toStrictEqual({
      name: "robots",
      content:
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    expect(canonical).toStrictEqual({
      tagName: "link",
      rel: "canonical",
      href: new URL(`/politika/clanek/${TIMESTAMP_SLUG}`, SITE_URL).href,
    });
  });

  it("renders a Slovenian Arhiv notice and links a newer copy", () => {
    const html = renderToStaticMarkup(
      createElement(ArchiveNotice, {
        newerTo: "/politika/clanek/novejsa-zgodba",
      }),
    );
    expect(html).toContain(ARCHIVE_LABEL);
    expect(html).toContain(ARCHIVE_MESSAGE);
    expect(html).toContain(NEWER_CLUSTER_LABEL);
    expect(html).toContain('href="/politika/clanek/novejsa-zgodba"');
  });

  it("caches a settled archive for an hour and a degraded lookup only briefly", () => {
    expect(clanekCacheControl(true)).toBe(
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(clanekCacheControl(true, true)).toBe(
      "public, max-age=10, s-maxage=10",
    );
    expect(clanekCacheControl(true, true)).not.toMatch(
      /stale-while-revalidate/,
    );
    expect(clanekCacheControl(false)).toBe("max-age=10, s-maxage=10");
    expect(clanekCacheControl(false, true)).toBe(
      "public, max-age=10, s-maxage=10",
    );
  });
});

describe("newer cluster lookup bounds", () => {
  const oldInput = {
    id: 4,
    runId: 14,
    createdAt: "2026-10-01T00:00:00.000Z",
    articleIds: [10, 11],
    newestPublishedAt: OLD_ARTICLE_AT,
    category: "politika",
  };

  beforeEach(() => {
    resetNewerClusterLookupForTests();
    vi.restoreAllMocks();
  });

  it("falls back to no newer link when the lookup times out, and always rolls back", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const lookup = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      failAt: "candidates",
    });

    const result = await resolveClanekArchive(lookup.db, oldInput, NOW);

    expect(result).toStrictEqual({
      archived: true,
      newerClusterPath: null,
      newerClusterDegraded: true,
    });
    expect(lookup.kinds()).toContain("begin");
    expect(lookup.kinds()).toContain("rollback");
    expect(lookup.kinds()).not.toContain("commit");
    expect(lookup.isOpen()).toBe(false);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/statement timeout/i);

    const retry = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "po-napaki", id: 50 }],
      categories: [{ categories: ["politika"], id: 1 }],
    });
    const retried = await resolveClanekArchive(retry.db, oldInput, NOW);
    expect(retried).toMatchObject({
      newerClusterPath: "/politika/clanek/po-napaki",
      newerClusterDegraded: false,
    });
    expect(retry.kinds()).toContain("candidates");
  });

  it("falls back to no newer link when category loading fails, and releases the transaction", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const lookup = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "novejsa-zgodba", id: 99 }],
      failAt: "categories",
    });

    const result = await resolveClanekArchive(lookup.db, oldInput, NOW);

    expect(result).toStrictEqual({
      archived: true,
      newerClusterPath: null,
      newerClusterDegraded: true,
    });
    expect(lookup.kinds()).toContain("rollback");
    expect(lookup.isOpen()).toBe(false);
  });

  it("skips the database on a cache hit, including a negative result", async () => {
    const first = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [],
    });
    const missed = await resolveClanekArchive(first.db, oldInput, NOW);
    expect(missed).toStrictEqual({
      archived: true,
      newerClusterPath: null,
      newerClusterDegraded: false,
    });
    expect(first.kinds()).toContain("candidates");

    const second = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "should-not-run", id: 1 }],
      categories: [{ categories: ["sport"], id: 1 }],
    });
    const hit = await resolveClanekArchive(second.db, oldInput, NOW);
    expect(hit).toStrictEqual({
      archived: true,
      newerClusterPath: null,
      newerClusterDegraded: false,
    });
    expect(second.kinds()).not.toContain("candidates");
    expect(second.kinds()).not.toContain("begin");
    expect(second.kinds()).toContain("selection");
  });

  it("serves a cached newer cluster without querying again", async () => {
    const first = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: null, id: 77 }],
      categories: [{ categories: ["not-a-category"], id: 1 }],
    });
    const missed = await resolveClanekArchive(
      first.db,
      { ...oldInput, category: "sport" },
      NOW,
    );
    expect(missed.newerClusterPath).toBe("/sport/clanek/77");

    const second = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
    });
    const hit = await resolveClanekArchive(
      second.db,
      { ...oldInput, category: "kriminal" },
      NOW,
    );
    expect(hit.newerClusterPath).toBe("/kriminal/clanek/77");
    expect(second.kinds()).not.toContain("candidates");
    expect(second.isOpen()).toBe(false);
  });

  it("queries again after the cache ttl", async () => {
    const first = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [],
    });
    await resolveClanekArchive(first.db, oldInput, NOW);

    const later = new Date(NOW.getTime() + 60 * 60 * 1000 + 1);
    const second = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "po-uri", id: 8 }],
      categories: [{ categories: ["politika"], id: 1 }],
    });
    const result = await resolveClanekArchive(second.db, oldInput, later);
    expect(result.newerClusterPath).toBe("/politika/clanek/po-uri");
    expect(second.kinds()).toContain("candidates");
  });

  it("skips the link when three lookups are already in flight", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = 0;
    const hanging = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      onCandidates: () => {
        started += 1;
        return gate;
      },
    });

    const inFlight = Promise.all(
      [5, 6, 7].map((id) =>
        resolveClanekArchive(hanging.db, { ...oldInput, id }, NOW),
      ),
    );
    await vi.waitFor(() => expect(started).toBe(3));

    const skipped = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "should-skip", id: 3 }],
      categories: [{ categories: ["politika"], id: 1 }],
    });
    const result = await resolveClanekArchive(
      skipped.db,
      { ...oldInput, id: 8 },
      NOW,
    );
    expect(result).toStrictEqual({
      archived: true,
      newerClusterPath: null,
      newerClusterDegraded: true,
    });
    expect(skipped.kinds()).not.toContain("candidates");
    expect(warn.mock.calls.join(" ")).toMatch(/saturated/i);

    release?.();
    const finished = await inFlight;
    expect(finished.map((item) => item.newerClusterPath)).toStrictEqual([
      null,
      null,
      null,
    ]);
    expect(hanging.isOpen()).toBe(false);

    const after = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "po-zasicenosti", id: 3 }],
      categories: [{ categories: ["politika"], id: 1 }],
    });
    const recovered = await resolveClanekArchive(
      after.db,
      { ...oldInput, id: 8 },
      NOW,
    );
    expect(recovered).toMatchObject({
      newerClusterPath: "/politika/clanek/po-zasicenosti",
      newerClusterDegraded: false,
    });
    expect(after.kinds()).toContain("candidates");
  });

  it("does not remember a degraded lookup, and does not give it the archive cache", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const failed = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      failAt: "candidates",
    });
    const degraded = await resolveClanekArchive(failed.db, oldInput, NOW);
    expect(degraded.newerClusterDegraded).toBe(true);
    expect(degraded.newerClusterPath).toBeNull();
    expect(
      clanekCacheControl(degraded.archived, degraded.newerClusterDegraded),
    ).toBe("public, max-age=10, s-maxage=10");
    expect(
      clanekCacheControl(degraded.archived, degraded.newerClusterDegraded),
    ).not.toMatch(/stale-while-revalidate|3600/);

    const headers = new Headers({
      "Cache-Control": clanekCacheControl(true, true),
    });
    expect(shouldStorePageCache("/politika/clanek/arhiv", headers)).toBe(true);
    expect(
      shouldStorePageCache(
        "/politika/clanek/arhiv",
        new Headers({ "Cache-Control": "no-store" }),
      ),
    ).toBe(false);
    expect(
      shouldStorePageCache(
        "/politika/clanek/arhiv",
        new Headers({
          "Cache-Control": clanekCacheControl(true, false),
        }),
      ),
    ).toBe(true);

    const settled = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [{ slug: "novejsa-zgodba", id: 99 }],
      categories: [{ categories: ["politika"], id: 1 }],
    });
    const retried = await resolveClanekArchive(settled.db, oldInput, NOW);
    expect(retried).toMatchObject({
      newerClusterDegraded: false,
      newerClusterPath: "/politika/clanek/novejsa-zgodba",
    });
    expect(settled.kinds()).toContain("candidates");
  });

  it("expires a concurrency slot from acquire time, not the request clock", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const now = vi.spyOn(Date, "now").mockReturnValue(NOW.getTime());
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = 0;
    const hanging = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      onCandidates: () => {
        started += 1;
        return gate;
      },
    });
    const inFlight = Promise.all(
      [5, 6, 7].map((id) =>
        resolveClanekArchive(hanging.db, { ...oldInput, id }, NOW),
      ),
    );
    try {
      await vi.waitFor(() => expect(started).toBe(3));

      const byRequestClock = lookupDb({
        selection: [{ latest_run_id: 15, in_current_selection: false }],
        candidates: [{ slug: "po-zahtevi", id: 2 }],
        categories: [{ categories: ["politika"], id: 1 }],
      });
      const stillHeld = await resolveClanekArchive(
        byRequestClock.db,
        { ...oldInput, id: 8 },
        new Date(NOW.getTime() + NEWER_CLUSTER_SLOT_TTL_MS + 1_000),
      );
      expect(stillHeld.newerClusterDegraded).toBe(true);
      expect(byRequestClock.kinds()).not.toContain("candidates");

      now.mockReturnValue(NOW.getTime() + NEWER_CLUSTER_SLOT_TTL_MS - 1);
      const stillFull = lookupDb({
        selection: [{ latest_run_id: 15, in_current_selection: false }],
        candidates: [{ slug: "prezgodaj", id: 2 }],
        categories: [{ categories: ["politika"], id: 1 }],
      });
      const blocked = await resolveClanekArchive(
        stillFull.db,
        { ...oldInput, id: 8 },
        NOW,
      );
      expect(blocked.newerClusterDegraded).toBe(true);
      expect(stillFull.kinds()).not.toContain("candidates");

      now.mockReturnValue(NOW.getTime() + NEWER_CLUSTER_SLOT_TTL_MS);
      const expired = lookupDb({
        selection: [{ latest_run_id: 15, in_current_selection: false }],
        candidates: [{ slug: "po-poteku", id: 9 }],
        categories: [{ categories: ["politika"], id: 1 }],
      });
      const admitted = await resolveClanekArchive(
        expired.db,
        { ...oldInput, id: 9 },
        NOW,
      );
      expect(admitted).toMatchObject({
        newerClusterDegraded: false,
        newerClusterPath: "/politika/clanek/po-poteku",
      });
      expect(expired.kinds()).toContain("candidates");
    } finally {
      now.mockRestore();
      release?.();
      await inFlight;
    }
  });

  it("bounds the lookup with a local statement timeout inside a transaction", () => {
    const candidates = compile(
      newerClusterCandidatesSql({
        articleIds: [10, 11],
        clusterId: 4,
        createdAt: "2026-10-01T00:00:00.000Z",
      }),
    );
    const from = candidates.sql.slice(
      candidates.sql.toLowerCase().indexOf("from"),
    );
    expect(from.indexOf("unnest")).toBeGreaterThanOrEqual(0);
    expect(from.indexOf("unnest")).toBeLessThan(
      from.indexOf("article_cluster"),
    );
    expect(from.indexOf("article_cluster")).toBeLessThan(
      from.indexOf("cluster_v2"),
    );
    expect(candidates.sql).toMatch(
      /order by .+"created_at" desc, .+"id" desc/i,
    );
    expect(candidates.sql).toMatch(/limit 1/i);
    expect(candidates.sql).not.toMatch(/lateral/i);
    expect(candidates.sql).not.toMatch(/json_agg/i);
    expect(candidates.params).toStrictEqual([
      10,
      11,
      4,
      "2026-10-01T00:00:00.000Z",
    ]);

    const categories = compile(newerClusterCategoriesSql(99));
    expect(categories.sql).toMatch(/published_at/i);
    expect(categories.sql).toMatch(/cluster_id/i);
    expect(categories.sql).not.toMatch(/cluster_v2/i);
    expect(categories.sql).not.toMatch(/lateral/i);
    expect(categories.params).toStrictEqual([99]);
  });

  it("sets the timeout guards before the candidate query and commits", async () => {
    const lookup = lookupDb({
      selection: [{ latest_run_id: 15, in_current_selection: false }],
      candidates: [],
    });
    await resolveClanekArchive(lookup.db, oldInput, NOW);
    const text = lookup.statements.map((statement) => statement.sql).join("\n");
    expect(text).toContain(
      `statement_timeout = '${NEWER_CLUSTER_STATEMENT_TIMEOUT}'`,
    );
    expect(text).toContain(`lock_timeout = '${NEWER_CLUSTER_LOCK_TIMEOUT}'`);
    expect(text).toContain(
      `idle_in_transaction_session_timeout = '${NEWER_CLUSTER_IDLE_IN_TRANSACTION_TIMEOUT}'`,
    );
    expect(text).toMatch(/join_collapse_limit = 1/i);
    expect(text).toMatch(/enable_hashjoin = off/i);
    expect(text).toMatch(/enable_seqscan = off/i);

    const kinds = lookup.kinds();
    const begin = kinds.indexOf("begin");
    const candidate = kinds.indexOf("candidates");
    const commit = kinds.indexOf("commit");
    expect(begin).toBeGreaterThanOrEqual(0);
    expect(begin).toBeLessThan(candidate);
    expect(candidate).toBeLessThan(commit);
    expect(lookup.isOpen()).toBe(false);
  });
});

describe("newer cluster query equivalence", () => {
  type Membership = { articleId: number; clusterId: number };
  type ClusterRow = {
    id: number;
    slug: string | null;
    createdAt: string;
  };
  type ArticleRow = {
    id: number;
    publishedAt: string | null;
    categories: string[] | null;
  };
  type Fixture = {
    memberships: Membership[];
    clusters: ClusterRow[];
    articles: ArticleRow[];
  };
  type LookupInput = {
    articleIds: number[];
    clusterId: number;
    createdAt: string;
    fallbackCategory: string | null;
  };

  function byNewestArticle(a: ArticleRow, b: ArticleRow): number {
    const aTime = publishedAtMillis(a.publishedAt);
    const bTime = publishedAtMillis(b.publishedAt);
    if (aTime == null && bTime != null) return 1;
    if (aTime != null && bTime == null) return -1;
    if (aTime != null && bTime != null && aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  }

  function categoryForCluster(
    fixture: Fixture,
    clusterId: number,
  ): string | null {
    const articles = fixture.memberships
      .filter((membership) => membership.clusterId === clusterId)
      .map((membership) =>
        fixture.articles.find((article) => article.id === membership.articleId),
      )
      .filter((article): article is ArticleRow => article != null)
      .sort(byNewestArticle);
    return clusterOwnCategory(articles);
  }

  /** Old join: article_cluster ⋈ cluster_v2, filter, order by created_at, limit 1, then categories. */
  function legacyNewerCluster(fixture: Fixture, input: LookupInput) {
    const cutoff = publishedAtMillis(input.createdAt);
    const matches = fixture.memberships
      .filter(
        (membership) =>
          input.articleIds.includes(membership.articleId) &&
          membership.clusterId !== input.clusterId,
      )
      .map((membership) =>
        fixture.clusters.find((cluster) => cluster.id === membership.clusterId),
      )
      .filter((cluster): cluster is ClusterRow => {
        if (cluster == null || cutoff == null) return false;
        const created = publishedAtMillis(cluster.createdAt);
        return created != null && created > cutoff;
      })
      .sort((a, b) => {
        const delta =
          (publishedAtMillis(b.createdAt) ?? 0) -
          (publishedAtMillis(a.createdAt) ?? 0);
        return delta !== 0 ? delta : b.id - a.id;
      });
    const picked = matches[0];
    if (!picked) return null;
    return newerClusterPath(
      {
        id: picked.id,
        slug: picked.slug,
        category: categoryForCluster(fixture, picked.id),
      },
      input.fallbackCategory,
    );
  }

  /** New plan: article ids → their cluster ids → newest cluster_v2 row → that cluster's categories. */
  function indexedNewerCluster(fixture: Fixture, input: LookupInput) {
    const cutoff = publishedAtMillis(input.createdAt);
    const clusterIds = [
      ...new Set(
        fixture.memberships
          .filter(
            (membership) =>
              input.articleIds.includes(membership.articleId) &&
              membership.clusterId !== input.clusterId,
          )
          .map((membership) => membership.clusterId),
      ),
    ];
    const picked = fixture.clusters
      .filter((cluster) => {
        if (!clusterIds.includes(cluster.id) || cutoff == null) return false;
        const created = publishedAtMillis(cluster.createdAt);
        return created != null && created > cutoff;
      })
      .sort((a, b) => {
        const delta =
          (publishedAtMillis(b.createdAt) ?? 0) -
          (publishedAtMillis(a.createdAt) ?? 0);
        return delta !== 0 ? delta : b.id - a.id;
      })[0];
    if (!picked) return null;
    return newerClusterPath(
      {
        id: picked.id,
        slug: picked.slug,
        category: categoryForCluster(fixture, picked.id),
      },
      input.fallbackCategory,
    );
  }

  const fixture: Fixture = {
    memberships: [
      { articleId: 10, clusterId: 4 },
      { articleId: 11, clusterId: 4 },
      { articleId: 10, clusterId: 4 },
      { articleId: 10, clusterId: 3 },
      { articleId: 10, clusterId: 7 },
      { articleId: 11, clusterId: 8 },
      { articleId: 20, clusterId: 8 },
      { articleId: 10, clusterId: 9 },
      { articleId: 12, clusterId: 9 },
      { articleId: 99, clusterId: 100 },
    ],
    clusters: [
      { id: 4, slug: "ta-zgodba", createdAt: "2026-10-01T00:00:00.000Z" },
      { id: 3, slug: "starejsa", createdAt: "2026-09-01T00:00:00.000Z" },
      { id: 7, slug: "enaka-meja", createdAt: "2026-10-01T00:00:00.000Z" },
      { id: 8, slug: "novejsa-osem", createdAt: "2026-10-20T00:00:00.000Z" },
      { id: 9, slug: null, createdAt: "2026-10-10T00:00:00.000Z" },
      { id: 100, slug: "tuj-clanek", createdAt: "2026-10-21T00:00:00.000Z" },
    ],
    articles: [
      {
        id: 10,
        publishedAt: "2026-10-02T00:00:00.000Z",
        categories: ["loklano"],
      },
      {
        id: 11,
        publishedAt: "2026-10-18T12:00:00.000Z",
        categories: ["politika"],
      },
      {
        id: 12,
        publishedAt: null,
        categories: ["kriminal"],
      },
      {
        id: 20,
        publishedAt: "2026-10-20T12:00:00.000Z",
        categories: ["loklano", "sport"],
      },
      {
        id: 99,
        publishedAt: "2026-10-21T12:00:00.000Z",
        categories: ["gospodarstvo"],
      },
    ],
  };

  const input: LookupInput = {
    articleIds: [10, 11],
    clusterId: 4,
    createdAt: "2026-10-01T00:00:00.000Z",
    fallbackCategory: "sport",
  };

  it("picks the same newer cluster as the old join", () => {
    expect(indexedNewerCluster(fixture, input)).toBe(
      legacyNewerCluster(fixture, input),
    );
    expect(indexedNewerCluster(fixture, input)).toBe(
      "/sport/clanek/novejsa-osem",
    );
  });

  it("agrees when there is no newer cluster and when the slug is missing", () => {
    const noNewer = indexedNewerCluster(fixture, {
      ...input,
      createdAt: "2026-10-20T00:00:00.000Z",
    });
    expect(noNewer).toBeNull();
    expect(noNewer).toBe(
      legacyNewerCluster(fixture, {
        ...input,
        createdAt: "2026-10-20T00:00:00.000Z",
      }),
    );

    const withoutEight: Fixture = {
      ...fixture,
      clusters: fixture.clusters.filter((cluster) => cluster.id !== 8),
    };
    expect(indexedNewerCluster(withoutEight, input)).toBe(
      legacyNewerCluster(withoutEight, input),
    );
    expect(indexedNewerCluster(withoutEight, input)).toBe("/kriminal/clanek/9");
  });

  it("breaks a created_at tie by the higher cluster id", () => {
    const tied: Fixture = {
      memberships: [
        { articleId: 10, clusterId: 4 },
        { articleId: 10, clusterId: 8 },
        { articleId: 10, clusterId: 30 },
      ],
      clusters: [
        { id: 4, slug: "ta-zgodba", createdAt: "2026-10-01T00:00:00.000Z" },
        { id: 8, slug: "nizji-id", createdAt: "2026-10-20T00:00:00.000Z" },
        { id: 30, slug: "visji-id", createdAt: "2026-10-20T00:00:00.000Z" },
      ],
      articles: [
        {
          id: 10,
          publishedAt: "2026-10-02T00:00:00.000Z",
          categories: ["politika"],
        },
      ],
    };
    const tiedInput: LookupInput = {
      articleIds: [10],
      clusterId: 4,
      createdAt: "2026-10-01T00:00:00.000Z",
      fallbackCategory: "sport",
    };
    expect(indexedNewerCluster(tied, tiedInput)).toBe(
      "/politika/clanek/visji-id",
    );
    expect(legacyNewerCluster(tied, tiedInput)).toBe(
      indexedNewerCluster(tied, tiedInput),
    );
  });
});
