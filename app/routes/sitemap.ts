import { href } from "react-router";
import { xml } from "remix-utils/responses";
import type { Route } from "./+types/sitemap";
import { Sitemap } from "~/lib/seo/sitemap";
import { SITE_URL } from "~/lib/seo";
import { config } from "~/config";
import type { CacheMeta } from "~/routes/api/populate-cache";
import { LAST_UPDATED as PRIVACY_LAST_UPDATED } from "~/routes/privacy-policy";
import { LAST_UPDATED as METHODOLOGY_LAST_UPDATED } from "~/routes/bias-methodology";
import { getAppContext } from "~/lib/appContext";
import { storyPath } from "~/lib/articleUrl";
import { META_CACHE_KEY } from "~/lib/kvCache/keys";
import { listPublicStories } from "~/lib/services/publicStories";

export async function loader({ context }: Route.LoaderArgs) {
  const { kvCache, db } = getAppContext(context);

  const meta = await kvCache.get<CacheMeta>(META_CACHE_KEY);
  const lastmod = meta?.lastUpdated ? new Date(meta.lastUpdated) : undefined;

  const origin = new URL(SITE_URL);
  const sitemap = new Sitemap();

  sitemap.append(new URL(href("/"), origin), { lastmod, priority: 1.0 });

  for (const category of config.categories) {
    sitemap.append(
      new URL(href("/:category", { category: category.key }), origin),
      { lastmod, priority: 0.8 },
    );
  }

  sitemap.append(new URL(href("/mediji"), origin), {
    lastmod,
    priority: 0.8,
  });
  sitemap.append(new URL(href("/metodologija"), origin), {
    lastmod: METHODOLOGY_LAST_UPDATED,
    priority: 0.7,
  });
  sitemap.append(new URL(href("/kontakt"), origin), {
    lastmod,
    priority: 0.5,
  });
  sitemap.append(new URL(href("/politika-zasebnosti"), origin), {
    lastmod: PRIVACY_LAST_UPDATED,
    priority: 0.3,
  });

  const providers = await db.query.newsProvider.findMany({
    columns: { key: true },
  });

  for (const provider of providers) {
    sitemap.append(
      new URL(
        href("/medij/:providerKey", { providerKey: provider.key }),
        origin,
      ),
      { lastmod, priority: 0.7 },
    );
  }

  const stories = await listPublicStories(db);

  for (const storyEntry of stories) {
    sitemap.append(new URL(storyPath(storyEntry.id), origin), {
      lastmod: storyEntry.lastmod,
      priority: 0.6,
    });
  }

  return xml(sitemap.toString(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
