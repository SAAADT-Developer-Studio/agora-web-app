import type { Route } from "./+types/home";

import { Article } from "~/components/article";
import ArticleBig from "~/components/article-big";

export type Image = {
  src: string;
  alt: string;
};

export type Article = {
  id: string;
  title: string;
  image: Image;
  tags: string[];
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
  url: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vidik.si" },
    { name: "description", content: "Welcome to Vidik!" },
    // TODO: Add more meta tags for SEO
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const dummyMain: Article = {
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

  const dummy: Article[] = [
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
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ArticleBig {...dummyMain} />
      {dummy.map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </div>
  );
}
