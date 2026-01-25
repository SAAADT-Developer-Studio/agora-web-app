import type { Route } from "./+types/home";
import { eq, isNotNull, sql, and, inArray } from "drizzle-orm";
import { lazy } from "react";

import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import {
  fetchInflationMonthlyYoY_SI,
  fetchSloveniaGDP,
} from "~/lib/services/external";
import {
  getCategoryArticles,
  getHomeArticles,
  type ArticleType,
} from "~/lib/services/ranking";
import { getProviderStats } from "~/lib/services/homePageProviderStats";
import { ProviderStatsCard } from "~/components/provider-stats-card";
import { config, CategoryKey, type CategoryKeyValue } from "~/config";
import type { Database } from "~/lib/db";

const EconomyCard = lazy(() =>
  import("~/components/economy-card").then((module) => ({
    default: module.EconomyCard,
  })),
);
import { resolvePromises } from "~/utils/resolvePromises";
import { getEnv } from "~/utils/getEnv";
import { data } from "react-router";
import { getMaxAge } from "~/utils/getMaxAge";
import { ErrorComponent } from "~/components/error-component";
import { VotingCard } from "~/components/voting-card";
import { HOME_CACHE_KEY } from "~/lib/kvCache/keys";
import { article, newsProvider } from "~/drizzle/schema";

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

  const categoryMap = {
    home: homeArticles,
  } as {
    home: ArticleType[];
  } & {
    [K in CategoryKeyValue]: ArticleType[];
  };

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

    categoryMap[category.key] = categoryArticles;
  }

  return categoryMap;
}
export async function fetchRandomProviders({ db }: { db: Database }) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const cols = {
    name: newsProvider.name,
    key: newsProvider.key,
    url: newsProvider.url,
    rank: newsProvider.rank,
    biasRating: newsProvider.biasRating,
    articlesCountToday: sql<number>`
      (
        select count(*)
        from ${article} a
        where a.${article.newsProviderKey} = ${newsProvider.key}
          and a.${article.publishedAt} >= ${startOfToday}
      )
    `.as("articles_count_today"),
  };

  const rank0Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 0), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank1Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 1), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank2Promise = db
    .select(cols)
    .from(newsProvider)
    .where(and(eq(newsProvider.rank, 2), isNotNull(newsProvider.biasRating)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const rank3Promise = db
    .select(cols)
    .from(newsProvider)
    .where(
      and(
        inArray(newsProvider.rank, [3, 4]),
        isNotNull(newsProvider.biasRating),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const [rank0, rank1, rank2, rank3] = await Promise.all([
    rank0Promise,
    rank1Promise,
    rank2Promise,
    rank3Promise,
  ]);

  const allProviders = [...rank0, ...rank1, ...rank2, ...rank3];

  return allProviders.map((p) => ({
    name: p.name,
    key: p.key,
    url: p.url,
    rank: p.rank,
    biasRating: p.biasRating,
    articleCountToday: Number(p.articlesCountToday ?? 0),
  }));
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db, kvCache } = context;

  const articles = await context.measurer.time(
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
  const {
    articles,
    gdpSeries,
    inflationSeries,
    providerStats,
    randomProviders,
  } = loaderData;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
      <HeroArticles articles={articles.home} />

      <CategorySection
        articles={articles[CategoryKey.politika]}
        categoryKey={CategoryKey.politika}
        dividerText="POLITIKA"
        sideSection={<VotingCard randomProviders={randomProviders} />}
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
        sideSection={<ProviderStatsCard providerStatsPromise={providerStats} />}
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
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
