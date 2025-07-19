import type { Route } from "./+types/home";

import { VidikBanner, VidikBannerType } from "~/components/vidik-banner";
import HighlightedPeople, {
  type HighlightedPeopleProps,
} from "~/components/highlighted-people";
import HeroArticles from "~/components/hero-articles";
import CategorySection from "~/components/category-section";

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
  return [
    { title: "Vidik" },
    { name: "description", content: "Welcome to Vidik!" },
    // TODO: Add more meta tags for SEO
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
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

  const dummyPeople: HighlightedPeopleProps["people"] = [
    {
      name: "Donald Trump",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
    },
    {
      name: "Donald Trump",
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
        people={dummyPeople}
        dividerText="POLITIKA"
      />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="GOSPODARSTVO"
        reverse
      />
      <VidikBanner type={VidikBannerType.SWIPE} />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="KRIMINAL"
      />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="ŠPORT"
        reverse
      />
      <VidikBanner type={VidikBannerType.DONATE} />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="KULTURA"
      />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="ZDRAVJE"
        reverse
      />
      <VidikBanner type={VidikBannerType.CONTACT} />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="OKOLJE"
      />
      <CategorySection
        articles={categoryArticles}
        people={dummyPeople}
        dividerText="LOKALNO"
        reverse
      />
    </div>
  );
}
