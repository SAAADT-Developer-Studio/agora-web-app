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

  // let lastArticleDate = articles.at(0)?.createdAt ?? new Date();
  // let lastTutorialDate = tutorials.at(0)?.createdAt ?? new Date();
  // let lastBookmarkDate = bookmarks.at(0)?.createdAt ?? new Date();

  // let lastPostDate = new Date(
  // 	Math.max(
  // 		lastArticleDate.getTime(),
  // 		lastTutorialDate.getTime(),
  // 		lastBookmarkDate.getTime(),
  // 	),
  // );

  sitemap.append(new URL(href("/"), url), new Date());
  for (const category of config.categories) {
    sitemap.append(new URL(category.path, url), new Date());
  }
  // sitemap.append(new URL(href("/articles"), url), lastArticleDate);
  // sitemap.append(new URL(href("/tutorials"), url), lastTutorialDate);
  // sitemap.append(new URL(href("/bookmarks"), url), lastBookmarkDate);

  // for (let article of articles) {
  // 	sitemap.append(new URL(article.pathname, url), article.createdAt);
  // }

  // for (let tutorial of tutorials) {
  // 	sitemap.append(new URL(tutorial.pathname, url), tutorial.createdAt);
  // }

  return xml(sitemap.toString());
}
