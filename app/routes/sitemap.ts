import { href } from "react-router";
import { xml } from "remix-utils/responses";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/sitemap";
import { Sitemap } from "~/lib/seo/sitemap";
import { SITE_URL } from "~/lib/seo";
import { config, isCategoryKey } from "~/config";
import type { CacheMeta } from "~/routes/api/populate-cache";
import { LAST_UPDATED as PRIVACY_LAST_UPDATED } from "~/routes/privacy-policy";
import { LAST_UPDATED as METHODOLOGY_LAST_UPDATED } from "~/routes/bias-methodology";
import { getAppContext } from "~/lib/appContext";
import { META_CACHE_KEY } from "~/lib/kvCache/keys";
import {
  article,
  articleCluster,
  clusterRun,
  clusterV2,
} from "~/drizzle/schema";

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

  // Latest production clustering run — same source of truth as homepage ranking.
  const clusters = await db.execute<{
    id: number;
    slug: string | null;
    created_at: string;
    category: string | null;
  }>(sql`
    WITH latest_run AS (
      SELECT ${clusterRun.id} AS id
      FROM ${clusterRun}
      WHERE ${clusterRun.isProduction} = true
      ORDER BY ${clusterRun.createdAt} DESC
      LIMIT 1
    )
    SELECT
      ${clusterV2.id} AS id,
      ${clusterV2.slug} AS slug,
      ${clusterV2.createdAt} AS created_at,
      (
        SELECT ${article.categories}[1]
        FROM ${articleCluster}
        INNER JOIN ${article}
          ON ${article.id} = ${articleCluster.articleId}
        WHERE ${articleCluster.clusterId} = ${clusterV2.id}
          AND ${article.categories}[1] IS NOT NULL
        LIMIT 1
      ) AS category
    FROM ${clusterV2}
    WHERE ${clusterV2.runId} = (SELECT id FROM latest_run)
  `);

  for (const cluster of clusters.rows) {
    const category = cluster.category?.toLowerCase();
    if (!category || !isCategoryKey(category)) continue;

    sitemap.append(
      new URL(
        href("/:category/clanek/:articleId", {
          category,
          articleId: cluster.slug ?? String(cluster.id),
        }),
        origin,
      ),
      {
        lastmod: cluster.created_at ? new Date(cluster.created_at) : lastmod,
        priority: 0.6,
      },
    );
  }

  return xml(sitemap.toString(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
