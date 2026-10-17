import { redirect } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import { getAppContext } from "~/lib/appContext";
import {
  REDIRECT_CACHE_CONTROL,
  storyPath,
  UNAVAILABLE_RETRY_AFTER,
} from "~/lib/articleUrl";
import { getSeoMetas } from "~/lib/seo";
import { preserveThrownHeaders } from "~/lib/seo/routeHeaders";
import { resolveClanekToStoryId } from "~/lib/services/resolveArticle";
import type { Route } from "./+types/article";

const GONE_HEADERS = {
  "X-Robots-Tag": "noindex",
  "Cache-Control": "public, max-age=300",
};

/**
 * Legacy `/:category/clanek/:articleId` URLs.
 * Every run mints a new cluster slug, and the category prefix is not part of
 * the identity, so these all 301 to the permanent `/zgodba/:storyId` URL.
 */
export function headers({ errorHeaders, loaderHeaders }: Route.HeadersArgs) {
  return preserveThrownHeaders({ errorHeaders, loaderHeaders });
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { db, measurer } = getAppContext(context);
  const resolution = await measurer.time("resolveClanekToStoryId", () =>
    resolveClanekToStoryId(db, params.articleId),
  );

  if (resolution.kind === "unavailable") {
    throw new Response("Service Unavailable", {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Retry-After": UNAVAILABLE_RETRY_AFTER,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  if (resolution.kind === "gone") {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: GONE_HEADERS,
    });
  }

  throw redirect(storyPath(resolution.id), {
    status: 301,
    headers: {
      "Cache-Control": REDIRECT_CACHE_CONTROL,
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
