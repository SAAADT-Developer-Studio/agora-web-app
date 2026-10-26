import type { Route } from "./+types/utrinki";
import { data } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import { UtrinkiFeed } from "~/components/utrinki/feed";
import { UtrinkiSkeleton } from "~/components/utrinki/states";
import { getSeoMetas } from "~/lib/seo";
import { UNINDEXED_ROBOTS } from "~/lib/seo/unindexed";
import { getAppContext } from "~/lib/appContext";
import { utrinkiCacheKey } from "~/lib/kvCache/keys";
import { loadUtrinkiPage } from "~/lib/utrinki/load";
import { parseUtrinkiQuery } from "~/lib/utrinki/model";
import { getMaxAge } from "~/utils/getMaxAge";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    },
  ];
}

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Utrinki | Vidik",
    description:
      "Kratki sklopi slovenskih novic: kaj se je zgodilo in kako o tem poročajo mediji. Stran ni del javnega kazala.",
    pathname: location.pathname,
    robots: UNINDEXED_ROBOTS,
    ogType: "website",
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  const responseHeaders = new Headers(loaderHeaders);
  responseHeaders.set("X-Robots-Tag", UNINDEXED_ROBOTS);
  return responseHeaders;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = parseUtrinkiQuery(url.searchParams);

  if (import.meta.env.DEV && url.searchParams.get("osnutek") === "1") {
    const { fixtureUtrinkiPage } = await import("~/lib/utrinki/fixtures");
    return data(
      { ...fixtureUtrinkiPage(query), draft: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { db, kvCache, measurer } = getAppContext(context);
  const page = await measurer.time("fetchUtrinki", () =>
    kvCache.cached(() => loadUtrinkiPage({ db, ...query }), {
      key: utrinkiCacheKey(query.category, query.page),
      expirationTtl: 10 * 60,
    }),
  );
  const maxAge = await getMaxAge(kvCache);

  return data(page, {
    headers: {
      "Cache-Control": `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${5 * 60}, stale-if-error=${3 * 60 * 60}`,
    },
  });
}

export function HydrateFallback() {
  return <UtrinkiSkeleton />;
}

export default function UtrinkiRoute({ loaderData }: Route.ComponentProps) {
  return <UtrinkiFeed page={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
