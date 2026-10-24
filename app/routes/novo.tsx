import type { Route } from "./+types/novo";

import { HomeFeed } from "~/components/home-feed";
import { getSeoMetas } from "~/lib/seo";
import { UNINDEXED_ROBOTS } from "~/lib/seo/unindexed";
import { fetchStoryHomeArticlesData } from "~/lib/services/storyRanking";
import { fetchRandomProviders } from "~/lib/services/randomProviders";
import { getEnv } from "~/utils/getEnv";
import { data } from "react-router";
import { getMaxAge } from "~/utils/getMaxAge";
import { ErrorComponent } from "~/components/error-component";
import { getAppContext } from "~/lib/appContext";
import { NOVO_HOME_CACHE_KEY } from "~/lib/kvCache/keys";

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Vidik - Novi izbor zgodb",
    description:
      "Predogled izbora slovenskih novic, razvrščenih po zgodbah. Stran ni del javnega kazala.",
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

export async function loader({ context }: Route.LoaderArgs) {
  const { db, kvCache, measurer } = getAppContext(context);

  const articles = await measurer.time(
    "fetchHomeArticlesData",
    async () =>
      await kvCache.cached(
        async () =>
          await fetchStoryHomeArticlesData({
            db,
          }),
        {
          key: NOVO_HOME_CACHE_KEY,
          expirationTtl: 10 * 60,
        },
      ),
  );

  const randomProviders = fetchRandomProviders({ db });

  const maxAge = await getMaxAge(kvCache);

  return data(
    {
      articles,
      randomProviders,
      env: getEnv(),
    },
    {
      headers: {
        "Cache-Control": `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${5 * 60}, stale-if-error=${3 * 60 * 60}`,
      },
    },
  );
}

export default function NovoHome({ loaderData }: Route.ComponentProps) {
  return (
    <HomeFeed
      articles={loaderData.articles}
      randomProviders={loaderData.randomProviders}
    />
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
