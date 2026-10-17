import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ArchiveNotice } from "~/components/archive-notice";
import type { Database } from "~/lib/db";
import {
  ARCHIVE_LABEL,
  ARCHIVE_MESSAGE,
  CLUSTERER_WINDOW_MS,
  INT4_MAX,
  NEWER_CLUSTER_LABEL,
  articleClusterWhere,
  clanekHttpStatus,
  clanekIndexing,
  clanekPath,
  clusterOwnCategory,
  findClusterForClanek,
  isArchivedCluster,
  isWithinClustererWindow,
  resolveClanekArchive,
  parseArticleClusterKey,
} from "~/lib/articleClusterLookup";
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

function executorDb(
  execute: (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>,
) {
  return { execute } as unknown as Database;
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

    expect(result).toStrictEqual({ archived: false, newerClusterPath: null });
    expect(executed).toBe(0);
  });

  it("does not archive an old cluster when its articles are in the latest run", async () => {
    const queries: ReturnType<typeof compile>[] = [];
    const result = await resolveClanekArchive(
      executorDb(async (query) => {
        queries.push(compile(query));
        return {
          rows: [{ latest_run_id: 15, in_current_selection: true }],
        };
      }),
      oldInput,
      NOW,
    );

    expect(result).toStrictEqual({ archived: false, newerClusterPath: null });
    expect(queries).toHaveLength(1);
    expect(queries[0]?.params).toStrictEqual(expect.arrayContaining([10, 11]));
    expect(queries[0]?.sql).not.toMatch(/\blike\b/i);
    expect(queries[0]?.sql).toMatch(/is_production/i);
  });

  it("does not archive the cluster from the latest run itself", async () => {
    let executed = 0;
    const result = await resolveClanekArchive(
      executorDb(async () => {
        executed += 1;
        return { rows: [{ latest_run_id: 14, in_current_selection: false }] };
      }),
      oldInput,
      NOW,
    );

    expect(result.archived).toBe(false);
    expect(executed).toBe(1);
  });

  it("does not archive when the latest-run query returns no row", async () => {
    let executed = 0;
    const result = await resolveClanekArchive(
      executorDb(async () => {
        executed += 1;
        return { rows: [] };
      }),
      oldInput,
      NOW,
    );

    expect(result.archived).toBe(false);
    expect(executed).toBe(1);
  });

  it("archives an old cluster outside the current selection and links a newer copy", async () => {
    const queries: ReturnType<typeof compile>[] = [];
    let executed = 0;
    const result = await resolveClanekArchive(
      executorDb(async (query) => {
        executed += 1;
        queries.push(compile(query));
        if (executed === 1) {
          return {
            rows: [{ latest_run_id: 15, in_current_selection: false }],
          };
        }
        return {
          rows: [{ slug: "novejsa-zgodba", id: 99, category: "politika" }],
        };
      }),
      { ...oldInput, runId: 14 },
      NOW,
    );

    expect(result).toStrictEqual({
      archived: true,
      newerClusterPath: "/politika/clanek/novejsa-zgodba",
    });
    expect(queries).toHaveLength(2);
    expect(queries.every((query) => !/\blike\b/i.test(query.sql))).toBe(true);
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
});
