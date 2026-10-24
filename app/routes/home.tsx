import type { Route } from "./+types/home";

import { HomeFeed } from "~/components/home-feed";
import { getSeoMetas } from "~/lib/seo";
import {
  emptyArticlesByCategory,
  getCategoryArticles,
  getHomeArticles,
} from "~/lib/services/ranking";
import { fetchRandomProviders } from "~/lib/services/randomProviders";
import { config } from "~/config";
import type { Database } from "~/lib/db";
import { getEnv } from "~/utils/getEnv";
import { BLINDSPOTS_PER_SIDE } from "~/utils/blindspots";
import { data } from "react-router";
import { getMaxAge } from "~/utils/getMaxAge";
import { ErrorComponent } from "~/components/error-component";
import { getAppContext } from "~/lib/appContext";
import { HOME_CACHE_KEY } from "~/lib/kvCache/keys";

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Vidik - Slovenske novice iz vseh vidikov",
    description:
      "Vidik je platforma, ki združuje novice iz vseh slovenskih medijev. Odkrijte, kako različni mediji poročajo o istih dogodkih in razumejte zgodbo z vseh vidikov.",
    pathname: location.pathname,
    keywords:
      "vidik, vidik slovenija, slovenske novice, ground news slovenia, ground news slovenija, aktualno, novice brez pristranskosti, medijska pristranskost, politika, gospodarstvo, šport, kriminal, kultura, zdravje, okolje, lokalno, slovenski mediji, objektivne novice, news aggregator slovenia",
    ogType: "website",
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export async function fetchHomeArticlesData({ db }: { db: Database }) {
  const homeArticles = await getHomeArticles({ db, count: 6 });
  let ignoredClusterIds = homeArticles.map((a) => Number(a.id));

  const byCategory = emptyArticlesByCategory();

  for (const category of config.categories) {
    const categoryArticles = await getCategoryArticles({
      db,
      ignoredClusterIds,
      count: 6,
      category: category.key,
    });

    ignoredClusterIds = [
      ...ignoredClusterIds,
      ...categoryArticles.map((a) => Number(a.id)),
    ];

    byCategory[category.key] = categoryArticles;
  }

  return {
    home: homeArticles,
    ...byCategory,
    // Searched across the whole run: one-sided stories rarely rank high.
    // A hero story can repeat here — the section answers a different question.
    blindspots: {
      left: await getHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "left",
      }),
      right: await getHomeArticles({
        db,
        count: BLINDSPOTS_PER_SIDE,
        side: "right",
      }),
    },
  };
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db, kvCache, measurer } = getAppContext(context);

  const articles = await measurer.time(
    "fetchHomeArticlesData",
    async () =>
      await kvCache.cached(
        async () =>
          await fetchHomeArticlesData({
            db,
          }),
        {
          key: HOME_CACHE_KEY,
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

export default function Home({ loaderData }: Route.ComponentProps) {
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
