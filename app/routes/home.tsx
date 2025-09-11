import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import { type SectionCardProps } from "~/components/section-card";
import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { getDb } from "~/lib/db";
import { cluster } from "~/drizzle/schema";
import { categoryArticles } from "~/mocks/categoryArticles";
import { dummyPeople } from "~/mocks/people";

export type Image = {
  src: string;
  alt: string;
};

export type ArticleType = {
  id: string;
  title: string;
  image: Image;
  tags: string[];
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
  url: string;
  showTags?: boolean;
};

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
  console.log("Loading clusters...");
  const db = await getDb();
  const clusters = await db.query.cluster.findMany({
    limit: 10,
    with: { articles: { columns: { imageUrls: true } } },
  });
  console.log({ clusters });

  const articles = clusters.map((c) => {
    const imgSrc =
      c.articles.find((a) => a.imageUrls !== undefined)?.imageUrls?.[0] ??
      "https://placehold.co/600x400";
    return {
      id: c.id.toString(),
      title: c.title,
      image: {
        src: imgSrc,
        alt: "Placeholder Image 1",
      },
      tags: ["sport", "gaming"],
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-1",
      showTags: true,
    };
  });

  return { articles };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  console.log("loaderData", loaderData.articles);
  const { articles } = loaderData;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <HeroArticles articles={articles} />
      <VidikBanner type={VidikBannerType.POLITICS} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="POLITIKA"
        sideSectionHeading="Izpostavljene Osebe"
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="GOSPODARSTVO"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ŠPORT"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="TEHNOLOGIJA & ZNANOST"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
      />
      <VidikBanner type={VidikBannerType.SWIPE} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KRIMINAL"
        sideSectionHeading="Izpostavljene Osebe"
      />

      <VidikBanner type={VidikBannerType.DONATE} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KULTURA"
        sideSectionHeading="Izpostavljene Osebe"
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ZDRAVJE"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
      />
      <VidikBanner type={VidikBannerType.CONTACT} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="OKOLJE"
        sideSectionHeading="Izpostavljene Osebe"
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="LOKALNO"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
      />
    </div>
  );
}
