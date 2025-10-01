import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import HeroArticles from "~/components/hero-articles";
import CategorySection, {
  SectionCardType,
} from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { categoryArticles } from "~/mocks/categoryArticles";
import { dummyPeople } from "~/mocks/people";
import fallbackArticleImage from "~/assets/fallback.png";
import type { PeopleCardProps } from "~/components/people-card";
import { fetchSloveniaGDP, fetchInflationMonthlyYoY_SI } from "~/lib/utils";
import { useEffect, useState } from "react";

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
  /*const db = await getDb();
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
  const gdpSeries = await fetchSloveniaGDP();
  const inflationSeries = await fetchInflationMonthlyYoY_SI();

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
*/
  const articles: ArticleType[] = [
    {
      id: "1",
      title: "Naslov članka 1",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 1",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-1",
      showTags: true,
      numberOfArticles: 1,
      tags: ["sport", "gaming"],
    },
    {
      id: "2",
      title: "Naslov članka 2",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 2",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-2",
      showTags: true,
      numberOfArticles: 1,
      tags: ["politics", "economy"],
    },
    {
      id: "3",
      title: "Naslov članka 3",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 3",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-3",
      showTags: true,
      numberOfArticles: 1,
      tags: ["technology", "science"],
    },
    {
      id: "4",
      title: "Naslov članka 4",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 4",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-4",
      showTags: true,
      numberOfArticles: 1,
      tags: ["health", "environment"],
    },
    {
      id: "5",
      title: "Naslov članka 5",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 5",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-5",
      showTags: true,
      numberOfArticles: 1,
      tags: ["culture", "lifestyle"],
    },
    {
      id: "6",
      title: "Naslov članka 6",
      image: {
        src: fallbackArticleImage,
        alt: "Placeholder Image 6",
      },
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-6",
      showTags: true,
      numberOfArticles: 1,
      tags: ["local", "community"],
    },
  ];
  const gdpSeries = await fetchSloveniaGDP();
  const inflationSeries = await fetchInflationMonthlyYoY_SI();
  return { articles, gdpSeries, inflationSeries };
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, gdpSeries, inflationSeries } = loaderData;

  const reverseAll = useMediaQuery("(min-width: 64rem)");

  return (
    <div className="grid grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
      <HeroArticles articles={articles} />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="POLITIKA"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="GOSPODARSTVO"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.Economy}
        gdpSeries={gdpSeries}
        inflationSeries={inflationSeries}
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ŠPORT"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="TEHNOLOGIJA & ZNANOST"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KRIMINAL"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="KULTURA"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="ZDRAVJE"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse={!reverseAll}
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="OKOLJE"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse
      />

      <CategorySection
        articles={categoryArticles}
        items={dummyPeople}
        dividerText="LOKALNO"
        sideSectionHeading="Izpostavljene Osebe"
        sideSectionType={SectionCardType.People}
        reverse={!reverseAll}
      />
    </div>
  );
}
