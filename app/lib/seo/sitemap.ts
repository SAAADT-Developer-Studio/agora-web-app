interface SiteURL {
  loc: URL;
  lastmod?: Date;
  priority?: number;
}

export class Sitemap {
  urls = new Set<SiteURL>();

  append(
    loc: URL,
    { lastmod, priority }: { lastmod?: Date; priority?: number } = {},
  ) {
    this.urls.add({ loc, lastmod, priority });
  }

  get size() {
    return this.urls.size;
  }

  toString() {
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
      ...this.urls,
    ]
      .map(
        (url) =>
          `<url><loc>${url.loc.toString()}</loc>${
            url.lastmod ? `<lastmod>${url.lastmod.toISOString()}</lastmod>` : ""
          }
          ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ""}
          </url>`,
      )
      .join("")}</urlset>`;
  }
}
