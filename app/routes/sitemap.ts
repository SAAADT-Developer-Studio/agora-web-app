import { xml } from "remix-utils/responses";
import type { Route } from "./+types/sitemap";
import { renderSitemapIndex } from "~/lib/seo/sitemap";
import { SITE_URL } from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { listStorySitemapChunks } from "~/lib/services/publicStories";

const CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = getAppContext(context);
  const chunks = await listStorySitemapChunks(db);
  const origin = new URL(SITE_URL);

  return xml(
    renderSitemapIndex([
      { loc: new URL("/sitemap-pages.xml", origin).href },
      ...chunks.map((chunk) => ({
        loc: new URL(`/sitemap-stories/${chunk.page}.xml`, origin).href,
        lastmod: chunk.lastmod,
      })),
    ]),
    { headers: CACHE },
  );
}
