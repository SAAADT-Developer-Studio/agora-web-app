import { redirect } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import { getAppContext } from "~/lib/appContext";
import { storyPath } from "~/lib/articleUrl";
import { getSeoMetas } from "~/lib/seo";
import { resolveClanekToStoryId } from "~/lib/services/resolveArticle";
import type { Route } from "./+types/article";

/**
 * Legacy `/:category/clanek/:articleId` URLs.
 * Every run mints a new cluster slug, and the category prefix is not part of
 * the identity, so these all 301 to the permanent `/zgodba/:storyId` URL.
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  const { db, measurer } = getAppContext(context);
  const storyId = await measurer.time("resolveClanekToStoryId", () =>
    resolveClanekToStoryId(db, params.articleId),
  );

  if (storyId == null) {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: {
        "X-Robots-Tag": "noindex",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  throw redirect(storyPath(storyId), {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Članek | Vidik",
    description: "Ta naslov se preusmeri na trajno stran zgodbe.",
    pathname: location.pathname,
    canonical: false,
    noindex: true,
    includeSiteSchema: false,
  });
}

export default function ArticleRedirect() {
  return null;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
