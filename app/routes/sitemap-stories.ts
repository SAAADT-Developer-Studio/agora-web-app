import { xml } from "remix-utils/responses";
import type { Route } from "./+types/sitemap-stories";
import { Sitemap } from "~/lib/seo/sitemap";
import { SITE_URL } from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { storyPath } from "~/lib/articleUrl";
import { listPublicStories } from "~/lib/services/publicStories";

export async function loader({ params, context }: Route.LoaderArgs) {
  const match = /^([1-9]\d*)\.xml$/.exec(params.page ?? "");
  const page = match ? Number(match[1]) : Number.NaN;
  if (!Number.isInteger(page) || page < 1) {
    throw new Response("Not Found", { status: 404 });
  }

  const { db } = getAppContext(context);
  const stories = await listPublicStories(db, { page });
  if (stories.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }

  const origin = new URL(SITE_URL);
  const sitemap = new Sitemap();
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
