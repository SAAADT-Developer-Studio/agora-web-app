import { xml } from "remix-utils/responses";
import type { Route } from "./+types/news-sitemap";
import { getAppContext } from "~/lib/appContext";
import { storyPath } from "~/lib/articleUrl";
import { SITE_NAME, SITE_URL } from "~/lib/seo";
import { renderNewsSitemap } from "~/lib/seo/newsSitemap";
import { listPublicStories } from "~/lib/services/publicStories";

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = getAppContext(context);
  const stories = await listPublicStories(db, {
    since: new Date(Date.now() - NEWS_WINDOW_MS),
  });
  const origin = new URL(SITE_URL);

  return xml(
    renderNewsSitemap(
      stories.map((storyEntry) => ({
        loc: new URL(storyPath(storyEntry.id), origin).href,
        title: storyEntry.title,
        publicationDate: storyEntry.publishedAt,
        publicationName: SITE_NAME,
        language: "sl",
      })),
    ),
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
