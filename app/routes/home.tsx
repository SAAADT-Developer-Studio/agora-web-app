import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { dummyPeople } from "~/mocks/people";
import {
  fetchInflationMonthlyYoY_SI,
  fetchSloveniaGDP,
} from "~/lib/services/external";
import { getCategoryArticles, getHomeArticles } from "~/lib/services/ranking";
import { PeopleCard } from "~/components/people-card";
import { EconomyCard } from "~/components/economy-card";
import { useMediaQuery } from "~/hooks/use-media-query";
import { getProviderStats } from "~/lib/services/providerStats";
import { ProviderStatsCard } from "~/components/provider-stats-card";
import { config, CategoryKey, type CategoryKeyValue } from "~/config";
import type { ArticleType } from "~/lib/services/ranking";
import type { Database } from "~/lib/db";
import { resolvePromises } from "~/utils/resolvePromises";
import { getEnv } from "~/utils/getEnv";
import { data } from "react-router";
import { getMaxAge } from "~/utils/getMaxAge";
import { TutorialPopup } from "~/components/tutorial-popup";

export function meta({ location }: Route.MetaArgs) {
  return getSeoMetas({
    title: "Vidik",
    description:
      "Odkrij, kako različni slovenski mediji poročajo o istih novicah. Naša platforma razkriva medijsko pristranskost in pomaga razumeti zgodbo z vseh političnih vidikov.",
    pathname: location.pathname,
    keywords:
      "vidik, novice, slovenija, aktualno, politika, gospodarstvo, šport, kriminal, kultura, zdravje, okolje, lokalno, news, slovenian news, slovenia news",
    ogType: "website",
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export async function fetchHomeArticlesData({ db }: { db: Database }) {
  const promiseMap = {
    home: getHomeArticles({ db, count: 6 }),
  } as {
    home: Promise<ArticleType[]>;
  } & {
    [K in CategoryKeyValue]: Promise<ArticleType[]>;
  };

  config.categories.forEach((category) => {
    promiseMap[category.key] = getCategoryArticles({
      db,
      count: 6,
      category: category.key,
    });
  });

  return await resolvePromises(promiseMap);
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db, kvCache } = context;

  const articles = await kvCache.cached(
    async () => await fetchHomeArticlesData({ db }),
    {
      key: "data:home",
      expirationTtl: 10 * 60,
    },
  );

  const gdpSeries = fetchSloveniaGDP();
  const inflationSeries = fetchInflationMonthlyYoY_SI();
  const providerStats = getProviderStats({ count: 9, db });

  const maxAge = await getMaxAge(kvCache);

  return data(
    {
      articles,
      gdpSeries,
      inflationSeries,
      providerStats,
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
  const { articles, gdpSeries, inflationSeries, providerStats } = loaderData;

  const reverseAll = useMediaQuery("(min-width: 64rem)");

  return (
    <>
      <TutorialPopup />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        <HeroArticles articles={articles.home} />

        <CategorySection
          articles={articles[CategoryKey.politika]}
          categoryKey={CategoryKey.politika}
          dividerText="POLITIKA"
          sideSection={
            // <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
            <ProviderStatsCard providerStatsPromise={providerStats} />
          }
        />

        <CategorySection
          articles={articles[CategoryKey.gospodarstvo]}
          categoryKey={CategoryKey.gospodarstvo}
          dividerText="GOSPODARSTVO"
          sideSection={
            <EconomyCard
              gdpSeries={gdpSeries}
              inflationSeries={inflationSeries}
            />
          }
        />

        <CategorySection
          articles={articles[CategoryKey.kriminal]}
          categoryKey={CategoryKey.kriminal}
          dividerText="KRIMINAL"
        />

        <CategorySection
          articles={articles[CategoryKey.lokalno]}
          categoryKey={CategoryKey.lokalno}
          dividerText="LOKALNO"
        />

        <CategorySection
          articles={articles[CategoryKey.sport]}
          categoryKey={CategoryKey.sport}
          dividerText="ŠPORT"
        />

        <CategorySection
          articles={articles[CategoryKey.tehnologijaZnanost]}
          categoryKey={CategoryKey.tehnologijaZnanost}
          dividerText="TEHNOLOGIJA & ZNANOST"
        />

        <CategorySection
          articles={articles[CategoryKey.kultura]}
          categoryKey={CategoryKey.kultura}
          dividerText="KULTURA"
        />

        <CategorySection
          articles={articles[CategoryKey.zdravje]}
          categoryKey={CategoryKey.zdravje}
          dividerText="ZDRAVJE"
        />

        <CategorySection
          articles={articles[CategoryKey.okolje]}
          categoryKey={CategoryKey.okolje}
          dividerText="OKOLJE"
        />
      </div>
    </>
  );
}
