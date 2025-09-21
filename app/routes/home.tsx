import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import HeroArticles from "~/components/hero-articles";
import CategorySection, {
  SectionCardType,
} from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { getDb } from "~/lib/db";
import { article, cluster } from "~/drizzle/schema";
import { categoryArticles } from "~/mocks/categoryArticles";
import { dummyPeople } from "~/mocks/people";
import { desc, eq, inArray, sql } from "drizzle-orm";
import fallbackArticleImage from "~/assets/fallback.png";
import { fetchSloveniaGDP } from "~/lib/utils";

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
  numberOfArticles: number;
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
  const articleCount = sql<number>`count(${article.id})`.as("article_count");

  const topClusterIds = await db
    .select({
      id: cluster.id,
      article_count: articleCount,
    })
    .from(cluster)
    .leftJoin(article, eq(cluster.id, article.clusterId))
    .groupBy(cluster.id)
    .orderBy(desc(articleCount))
    .limit(10);

  const topClusters = await db.query.cluster.findMany({
    where: inArray(
      cluster.id,
      topClusterIds.map((c) => c.id),
    ),
    with: {
      articles: {
        columns: { imageUrls: true },
      },
    },
  });
  topClusters.sort((a, b) => {
    const aCount = topClusterIds.find((c) => c.id === a.id)?.article_count ?? 0;
    const bCount = topClusterIds.find((c) => c.id === b.id)?.article_count ?? 0;
    return bCount - aCount;
  });

  const articles: ArticleType[] = topClusters.map((c) => {
    console.log("Cluster:", c);
    const imgSrc =
      c.articles.find((a) => a.imageUrls && a.imageUrls.length > 0)
        ?.imageUrls?.[0] ?? fallbackArticleImage;
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
      numberOfArticles: c.articles.length,
    };
  });

  const gdpSeries = await fetchSloveniaGDP();

  return { articles, gdpSeries };
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
        sideSectionType={SectionCardType.People}
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="GOSPODARSTVO"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.Economy}
        gdpSeries={loaderData.gdpSeries}
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ŠPORT"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="TEHNOLOGIJA & ZNANOST"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
      <VidikBanner type={VidikBannerType.SWIPE} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KRIMINAL"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />

      <VidikBanner type={VidikBannerType.DONATE} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KULTURA"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ZDRAVJE"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
      <VidikBanner type={VidikBannerType.CONTACT} />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="OKOLJE"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="LOKALNO"
        reverse
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
      />
    </div>
  );
}
