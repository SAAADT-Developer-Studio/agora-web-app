import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { ArchiveNotice } from "~/components/archive-notice";
import {
  ARCHIVE_LABEL,
  ARCHIVE_MESSAGE,
  INT4_MAX,
  articleClusterWhere,
  clanekHttpStatus,
  clanekIndexing,
  isArchivedCluster,
  latestProductionRunIdSql,
  parseArticleClusterKey,
} from "~/lib/articleClusterLookup";
import { getSeoMetas, SITE_URL } from "~/lib/seo";

const DIGIT_SLUG =
  "18-tisoc-let-stare-figurice-in-druge-skrivnosti-kamene-dobe-2026-10-17-16-13-17";
const TIMESTAMP_SLUG = "zaporedje-odstopov-2026-10-17-16-13-523";

const dialect = new PgDialect();

function compile(query: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return dialect.sqlToQuery(query);
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

  it("keeps the latest-run lookup separate from the cluster predicate", () => {
    const compiled = compile(latestProductionRunIdSql());
    expect(compiled.sql).toMatch(/is_production/i);
    expect(compiled.sql).toMatch(/order by/i);
    expect(compiled.sql).toMatch(/limit/i);
    expect(compiled.sql).not.toMatch(/\blike\b/i);
    expect(compiled.sql).not.toMatch(/cluster_v2/i);
  });
});

describe("archived clanek pages", () => {
  it("marks a cluster outside the latest production run as archived", () => {
    expect(isArchivedCluster(4, 9)).toBe(true);
    expect(isArchivedCluster(9, 9)).toBe(false);
    expect(isArchivedCluster(9, null)).toBe(true);
  });

  it("returns 200 when the row exists and 404 only when it does not", () => {
    expect(isArchivedCluster(4, 9)).toBe(true);
    expect(clanekHttpStatus(true)).toBe(200);
    expect(clanekHttpStatus(false)).toBe(404);
  });

  it("stays indexable and self-canonical when the cluster is archived", () => {
    const pathname = `/slovenija/clanek/${DIGIT_SLUG}`;
    expect(clanekIndexing(true)).toStrictEqual({ noindex: false });
    expect(clanekIndexing(false)).toStrictEqual({ noindex: true });

    const metas = getSeoMetas({
      title: "Naslov | Vidik",
      description: "Opis",
      pathname,
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
      href: new URL(pathname, SITE_URL).href,
    });
  });

  it("renders a Slovenian Arhiv notice", () => {
    const html = renderToStaticMarkup(createElement(ArchiveNotice));
    expect(html).toContain(ARCHIVE_LABEL);
    expect(html).toContain(ARCHIVE_MESSAGE);
    expect(html).toContain("arhivirana");
  });
});

describe("article route", () => {
  it("does not parseInt the param or filter the cluster query", () => {
    const source = readFileSync(
      new URL("../app/routes/article.tsx", import.meta.url),
      "utf8",
    );
    expect(source.includes("parseInt")).toBe(false);
    expect(source.includes("db.transaction")).toBe(false);
    expect(source.includes("articleClusterWhere")).toBe(true);
    expect(source).not.toMatch(/interval\s+'/);
    expect(source).not.toMatch(/latest_run/i);
  });
});
