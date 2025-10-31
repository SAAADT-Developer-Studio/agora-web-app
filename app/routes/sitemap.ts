import { href } from "react-router";
import { xml } from "remix-utils/responses";
import type { Route } from "./+types/sitemap";
import { Sitemap } from "~/lib/seo/sitemap";
import { config } from "~/config";
import type { CacheMeta } from "~/routes/api/populate-cache";
import { LAST_UPDATED } from "~/routes/privacy-policy";
import { META_CACHE_KEY } from "~/lib/kvCache/keys";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { kvCache, db } = context;

  const meta = await kvCache.get<CacheMeta>(META_CACHE_KEY);
  const lastmod = meta?.lastUpdated ? new Date(meta.lastUpdated) : undefined;

  const url = new URL(request.url);
  url.pathname = "";

  const sitemap = new Sitemap();

  sitemap.append(new URL(href("/"), url), { lastmod, priority: 1.0 });
  for (const category of config.categories) {
    sitemap.append(
      new URL(href("/:category", { category: category.key }), url),
      { lastmod, priority: 0.8 },
    );
  }

  sitemap.append(new URL(href("/kontakt"), url), { lastmod, priority: 0.5 });
  sitemap.append(new URL(href("/politika-zasebnosti"), url), {
    lastmod: LAST_UPDATED,
    priority: 0.3,
  });

  const providers = await db.query.newsProvider.findMany({
    columns: { key: true },
  });

  for (const provider of providers) {
    sitemap.append(
      new URL(href("/medij/:providerKey", { providerKey: provider.key }), url),
      { lastmod, priority: 0.7 },
    );
  }

  sitemap.append(new URL(href("/mediji"), url), { lastmod, priority: 0.8 });

  // const clusters = await db.query.cluster.findMany({ columns: { id: true } });
  // for (const cluster of clusters) {
  //   sitemap.append(
  //     new URL(
  //       href("/:category/clanek/:articleId", {
  //         articleId: cluster.id.toString(),
  //         category: "TODO",
  //       }),
  //       url,
  //     ),
  //     { lastmod, priority: 0.6 },
  //   );
  // }

  return xml(sitemap.toString());
}
