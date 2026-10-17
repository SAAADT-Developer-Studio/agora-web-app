interface SiteURL {
  loc: URL;
  lastmod?: Date;
  priority?: number;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
    const entries = [...this.urls]
      .map((url) => {
        const parts = [`<loc>${escapeXml(url.loc.toString())}</loc>`];
        if (url.lastmod) {
          parts.push(`<lastmod>${url.lastmod.toISOString()}</lastmod>`);
        }
        if (url.priority !== undefined) {
          parts.push(`<priority>${url.priority.toFixed(1)}</priority>`);
        }
        return `<url>${parts.join("")}</url>`;
      })
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
  }
}

export function renderSitemapIndex(
  entries: { loc: string; lastmod?: Date }[],
): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `<lastmod>${entry.lastmod.toISOString()}</lastmod>`
        : "";
      return `<sitemap><loc>${escapeXml(entry.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
