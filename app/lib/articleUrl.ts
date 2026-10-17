/**
 * Public article URLs.
 *
 * Clustering runs mint a new `cluster_v2.slug` about every 10 minutes:
 * `{slugify(title)}-{YYYY-MM-DD-HH-MM}-{index}`. That slug is not stable.
 * The permanent URL is `/zgodba/{story.id}`.
 */

const LEGACY_RUN_SUFFIX =
  /^(?<titleSlug>.+)-(?<stamp>\d{4}-\d{2}-\d{2}-\d{2}-\d{2})-(?<index>\d+)$/;

export type ParsedArticleParam =
  | { kind: "cluster-id"; id: number; raw: string }
  | { kind: "slug"; titleSlug: string; raw: string };

/**
 * Classify a `clanek` param.
 *
 * Only an all-digit param is a legacy cluster id. `parseInt` would treat
 * `18-tisoc-...` and `2026-10-17-...` as integers and look up the wrong row.
 */
export function parseArticleParam(articleId: string): ParsedArticleParam {
  if (/^\d+$/.test(articleId)) {
    return {
      kind: "cluster-id",
      id: Number(articleId),
      raw: articleId,
    };
  }

  const legacy = LEGACY_RUN_SUFFIX.exec(articleId);
  if (legacy?.groups?.titleSlug) {
    return {
      kind: "slug",
      titleSlug: legacy.groups.titleSlug,
      raw: articleId,
    };
  }

  return { kind: "slug", titleSlug: articleId, raw: articleId };
}

/** Title portion of a `cluster_v2.slug`, without the run timestamp and index. */
export function clusterTitleSlug(slug: string): string {
  const parsed = parseArticleParam(slug);
  return parsed.kind === "slug" ? parsed.titleSlug : slug;
}

export function storyPath(storyId: number): string {
  return `/zgodba/${storyId}`;
}
