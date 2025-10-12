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

export function headers(_: Route.HeadersArgs) {
  // TODO: compute maxage based on the last update, instead of having it hard coded to 10 minutes
  const maxAge = 10 * 60; // 10 minutes
  return {
    "Cache-Control": `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${10 * 60}, stale-if-error=${3 * 60 * 60}`,
  };
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.db;

  const [
    home,
    politika,
    gospodarstvo,
    sport,
    tehnologijaZnanost,
    kriminal,
    kultura,
    zdravje,
    okolje,
    lokalno,
  ] = await Promise.all([
    getHomeArticles({ db, count: 6 }),
    getCategoryArticles({ db, count: 4, category: "politika" }),
    getCategoryArticles({ db, count: 4, category: "gospodarstvo" }),
    getCategoryArticles({ db, count: 4, category: "sport" }),
    getCategoryArticles({ db, count: 4, category: "tehnologija-znanost" }),
    getCategoryArticles({ db, count: 4, category: "kriminal" }),
    getCategoryArticles({ db, count: 4, category: "kultura" }),
    getCategoryArticles({ db, count: 4, category: "zdravje" }),
    getCategoryArticles({ db, count: 4, category: "okolje" }),
    getCategoryArticles({ db, count: 4, category: "lokalno" }),
  ]);
  const gdpSeries = fetchSloveniaGDP();
  const inflationSeries = fetchInflationMonthlyYoY_SI();

  return {
    articles: {
      home,
      politika,
      gospodarstvo,
      sport,
      tehnologijaZnanost,
      kriminal,
      kultura,
      zdravje,
      okolje,
      lokalno,
    },
    gdpSeries,
    inflationSeries,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, gdpSeries, inflationSeries } = loaderData;

  const reverseAll = useMediaQuery("(min-width: 64rem)");

  console.log(articles);

  return (
    <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-2 md:gap-6 md:px-6 lg:grid-cols-3">
      <HeroArticles articles={articles.home} />

      <CategorySection
        articles={articles.politika}
        dividerText="POLITIKA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={articles.gospodarstvo}
        dividerText="GOSPODARSTVO"
        sideSection={
          <EconomyCard
            gdpSeries={gdpSeries}
            inflationSeries={inflationSeries}
          />
        }
        reverse
      />

      <CategorySection
        articles={articles.kriminal}
        dividerText="KRIMINAL"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={articles.lokalno}
        dividerText="LOKALNO"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={articles.sport}
        dividerText="ŠPORT"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse
      />

      <CategorySection
        articles={articles.tehnologijaZnanost}
        dividerText="TEHNOLOGIJA & ZNANOST"
        reverse={!reverseAll}
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />

      <CategorySection
        articles={articles.kultura}
        dividerText="KULTURA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse
      />

      <CategorySection
        articles={articles.zdravje}
        dividerText="ZDRAVJE"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={articles.okolje}
        dividerText="OKOLJE"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse
      />
    </div>
  );
}
