import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { categoryArticles } from "~/mocks/categoryArticles";
import { dummyPeople } from "~/mocks/people";
import {
  fetchInflationMonthlyYoY_SI,
  fetchSloveniaGDP,
} from "~/lib/services/external";
import { getHomeArticles } from "~/lib/services/ranking";
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

export async function loader({ context }: Route.LoaderArgs) {
  const articles = await getHomeArticles();
  const gdpSeries = fetchSloveniaGDP();
  const inflationSeries = fetchInflationMonthlyYoY_SI();

  return { articles, gdpSeries, inflationSeries };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, gdpSeries, inflationSeries } = loaderData;

  const reverseAll = useMediaQuery("(min-width: 64rem)");

  return (
    <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-2 md:gap-6 md:px-6 lg:grid-cols-3">
      <HeroArticles articles={articles} />

      <CategorySection
        articles={categoryArticles}
        dividerText="POLITIKA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
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
        articles={categoryArticles}
        dividerText="ŠPORT"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="TEHNOLOGIJA & ZNANOST"
        reverse
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="KRIMINAL"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="KULTURA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="ZDRAVJE"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="OKOLJE"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        dividerText="LOKALNO"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
        reverse={!reverseAll}
      />
    </div>
  );
}
