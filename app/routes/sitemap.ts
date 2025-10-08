import { href } from "react-router";
import { xml } from "remix-utils/responses";
import { getDb } from "~/lib/db";
import type { Route } from "./+types/providers";
import { Sitemap } from "~/lib/seo/sitemap";
import { config } from "~/config";

export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  url.pathname = "";

  const db = await getDb();
  const sitemap = new Sitemap();

  // TODO: compute the dates properly
  sitemap.append(new URL(href("/"), url), new Date());
  for (const category of config.categories) {
    sitemap.append(new URL(category.path, url), new Date());
  }

  const clusters = await db.query.cluster.findMany({ columns: { id: true } });
  for (const cluster of clusters) {
    sitemap.append(
      new URL(
        href("/article/:articleId", { articleId: cluster.id.toString() }),
        url,
      ),
      new Date(),
    );
  }

  // sitemap.append(new URL(href("/articles"), url), lastArticleDate);

  return xml(sitemap.toString());
}
