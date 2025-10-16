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
import { config, CategoryKey, type CategoryKeyValue } from "~/config";
import type { ArticleType } from "~/lib/services/ranking";
import type { Database } from "~/lib/db";
import { resolvePromises } from "~/utils/resolvePromises";
import { cached } from "~/lib/cached";
import { getEnv } from "~/utils/getEnv";
import { data } from "react-router";

export function meta({}: Route.MetaArgs) {
  return getSeoMetas({
    title: "Vidik",
    // gpt wrote this, thats why it sucks
    description:
      "Odkrijte novice in razkrijte njihovo politično obarvanost na enem mestu",
    image: "todo",
    url: "https://vidik.si",
    keywords:
      "vidik, novice, slovenija, aktualno, politika, gospodarstvo, šport, kriminal, kultura, zdravje, okolje, lokalno, news, slovenian news, slovenia news",
    ogType: "website",
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return {
    ...loaderHeaders,
  };
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
  const db = context.db;

  const articles = await cached(
    async () => await fetchHomeArticlesData({ db }),
    {
      key: "data:home",
      expirationTtl: 10 * 60,
      cloudflare: context.cloudflare,
    },
  );

  const gdpSeries = fetchSloveniaGDP();
  const inflationSeries = fetchInflationMonthlyYoY_SI();

  // TODO: compute maxage based on the last update, instead of having it hard coded
  const maxAge = 3 * 60;

  return data(
    {
      articles,
      gdpSeries,
      inflationSeries,
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
  const { articles, gdpSeries, inflationSeries, env } = loaderData;

  const reverseAll = useMediaQuery("(min-width: 64rem)");

  return (
    <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-2 md:gap-6 md:px-6 lg:grid-cols-3">
      <HeroArticles articles={articles.home} />

      <CategorySection
        articles={articles[CategoryKey.politika]}
        dividerText="POLITIKA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />

      <CategorySection
        articles={articles[CategoryKey.gospodarstvo]}
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
        dividerText="KRIMINAL"
      />

      <CategorySection
        articles={articles[CategoryKey.lokalno]}
        dividerText="LOKALNO"
      />

      <CategorySection
        articles={articles[CategoryKey.sport]}
        dividerText="ŠPORT"
      />

      <CategorySection
        articles={articles[CategoryKey.tehnologijaZnanost]}
        dividerText="TEHNOLOGIJA & ZNANOST"
      />

      <CategorySection
        articles={articles[CategoryKey.kultura]}
        dividerText="KULTURA"
      />

      <CategorySection
        articles={articles[CategoryKey.zdravje]}
        dividerText="ZDRAVJE"
      />

      <CategorySection
        articles={articles[CategoryKey.okolje]}
        dividerText="OKOLJE"
      />
    </div>
  );
}
