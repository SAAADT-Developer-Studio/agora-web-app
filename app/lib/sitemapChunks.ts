/** Google allows 50,000 URLs per file. Chunk well under that, by story id. */
export const SITEMAP_CHUNK_SIZE = 5_000;

/** Stable id window for a 1-based sitemap page. Stories do not shift pages. */
export function sitemapIdBounds(
  page: number,
  size = SITEMAP_CHUNK_SIZE,
): { minExclusive: number; maxInclusive: number } | null {
  if (!Number.isInteger(page) || page < 1 || page > 10_000) return null;
  if (!Number.isInteger(size) || size < 1) return null;
  return {
    minExclusive: (page - 1) * size,
    maxInclusive: page * size,
  };
}
