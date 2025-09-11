import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import { type SectionCardProps } from "~/components/section-card";
import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";
import { getSeoMetas } from "~/lib/seo";
import { getDb } from "~/lib/db";
import { cluster } from "~/drizzle/schema";

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
  const clusters = await db.select().from(cluster);
  console.log({ clusters });
  // .limit(10);

  return { clusters };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  console.log("loaderData", loaderData.clusters);
  const dummyMain: ArticleType = {
    id: "1",
    title:
      "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
    image: {
      src: "https://placehold.co/600x400",
      alt: "Placeholder Image 1",
    },
    tags: ["sport", "gaming"],
    leftPercent: 33,
    rightPercent: 33,
    centerPercent: 34,
    url: "/article-1",
  };

  const dummy: ArticleType[] = [
    {
      id: "1",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 1",
      },
      tags: ["sport", "gaming"],
      leftPercent: 33,
      rightPercent: 33,
      centerPercent: 34,
      url: "/article-1",
      showTags: true,
    },
    {
      id: "2",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 15,
      rightPercent: 80,
      centerPercent: 5,
      url: "/article-2",
      showTags: true,
    },
    {
      id: "3",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 3",
      },
      tags: ["sport", "gaming"],
      leftPercent: 0,
      rightPercent: 10,
      centerPercent: 90,
      url: "/article-3",
      showTags: true,
    },
    {
      id: "4",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 1",
      },
      tags: ["sport", "gaming"],
      leftPercent: 90,
      rightPercent: 5,
      centerPercent: 5,
      url: "/article-1",
      showTags: true,
    },
    {
      id: "5",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
      showTags: true,
    },
    {
      id: "6",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
      showTags: true,
    },
    {
      id: "7",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
      showTags: true,
    },
    {
      id: "8",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
      showTags: true,
    },
    {
      id: "9",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
      showTags: true,
    },
  ];

  const categoryArticles: ArticleType[] = [
    {
      id: "6",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
    },
    {
      id: "7",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
    },
    {
      id: "8",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
    },
    {
      id: "9",
      title:
        "Redbull je slab zate ampak za to ker si vstala primorska si v novo življenje",
      image: {
        src: "https://placehold.co/600x400",
        alt: "Placeholder Image 2",
      },
      tags: ["sport", "gaming"],
      leftPercent: 50,
      rightPercent: 50,
      centerPercent: 0,
      url: "/article-2",
    },
  ];

  const dummyPeople: SectionCardProps["items"] = [
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      description: "Former President of the United States",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
  ];

  const dummyEvent: SectionCardProps["items"] = [
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "9/11",
      description: "Here comes the airplane",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <HeroArticles articles={dummy} />
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
