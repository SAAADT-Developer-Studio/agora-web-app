export type NewsSitemapEntry = {
  loc: string;
  title: string;
  publicationDate: Date;
  publicationName?: string;
  language?: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Google News sitemap. Only permanent story URLs, last 48 hours. */
export function renderNewsSitemap(entries: NewsSitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const name = entry.publicationName ?? "Vidik";
      const language = entry.language ?? "sl";
      return (
        "<url>" +
        `<loc>${escapeXml(entry.loc)}</loc>` +
        "<news:news>" +
        "<news:publication>" +
        `<news:name>${escapeXml(name)}</news:name>` +
        `<news:language>${escapeXml(language)}</news:language>` +
        "</news:publication>" +
        `<news:publication_date>${entry.publicationDate.toISOString()}</news:publication_date>` +
        `<news:title>${escapeXml(entry.title)}</news:title>` +
        "</news:news>" +
        "</url>"
      );
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">` +
    urls +
    `</urlset>`
  );
}
