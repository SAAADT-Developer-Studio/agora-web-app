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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <HeroArticles articles={articles} />
      <VidikBanner type={VidikBannerType.POLITICS} />
      <CategorySection
        articles={categoryArticles}
        dividerText="POLITIKA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <CategorySection
        articles={categoryArticles}
        dividerText="GOSPODARSTVO"
        reverse
        sideSection={
          <EconomyCard
            gdpSeries={gdpSeries}
            inflationSeries={inflationSeries}
          />
        }
      />
      <CategorySection
        articles={categoryArticles}
        dividerText="ŠPORT"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <CategorySection
        articles={categoryArticles}
        dividerText="TEHNOLOGIJA & ZNANOST"
        reverse
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <VidikBanner type={VidikBannerType.SWIPE} />
      <CategorySection
        articles={categoryArticles}
        dividerText="KRIMINAL"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />

      <VidikBanner type={VidikBannerType.DONATE} />
      <CategorySection
        articles={categoryArticles}
        dividerText="KULTURA"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <CategorySection
        articles={categoryArticles}
        dividerText="ZDRAVJE"
        reverse
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <VidikBanner type={VidikBannerType.CONTACT} />
      <CategorySection
        articles={categoryArticles}
        dividerText="OKOLJE"
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
      <CategorySection
        articles={categoryArticles}
        dividerText="LOKALNO"
        reverse
        sideSection={
          <PeopleCard items={dummyPeople} heading="Izpostavljene Osebe" />
        }
      />
    </div>
  );
}
