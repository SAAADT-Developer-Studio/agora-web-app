import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { ArticleType } from "~/lib/services/ranking";
import {
  CategoryChip,
  storyHref,
  tileClassName,
  tileImageClassName,
} from "./article";
import { BiasBar, StoryMetaLine } from "./story-meta";

const CYCLE_MS = 4500;

export default function ArticleBig(article: ArticleType) {
  const { image, title, tags, biasDistribution, providerKeys } = article;
  const images = article.images?.length ? article.images : [image.src];
  const current = useImageCycle(images.length);

  return (
    <Link
      to={storyHref(article)}
      prefetch="intent"
      className={cn(
        tileClassName,
        "h-[340px] sm:col-span-2 sm:row-span-2 md:h-[500px]",
      )}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          fetchPriority={index === 0 ? "high" : "low"}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          className={tileImageClassName}
          style={{
            opacity: index === current ? 1 : 0,
            transition: "opacity 1800ms ease-in-out, scale 500ms ease-out",
          }}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-45% to-black/0"
      />

      <div className="relative flex gap-1.5 p-4 md:p-6">
        {tags.slice(0, 2).map((tag) => (
          <CategoryChip key={tag} tag={tag} />
        ))}
      </div>

      <div className="relative flex flex-col gap-3 p-4 md:gap-4 md:p-6">
        <h2 className="max-w-[34ch] text-[1.4rem] leading-[1.15] font-bold tracking-tight text-balance md:text-[2.1rem] md:leading-[1.1]">
          {title}
        </h2>
        <StoryMetaLine
          providerKeys={providerKeys}
          numberOfArticles={article.numberOfArticles}
          lastPublishedAt={article.lastPublishedAt}
          className="text-sm text-white/80"
          stackClassName="size-6 border-black/40"
        />
        <BiasBar distribution={biasDistribution} labels />
      </div>
    </Link>
  );
}

/** Index of the visible image; holds still for reduced motion or one image. */
function useImageCycle(count: number) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const still =
      count <= 1 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return undefined;
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % count),
      CYCLE_MS,
    );
    return () => clearInterval(interval);
  }, [count]);

  return current % Math.max(count, 1);
}
