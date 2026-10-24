import { href, Link } from "react-router";
import { cn } from "~/lib/utils";
import type { ArticleType } from "~/lib/services/ranking";
import { BiasBar, categoryLabel, StoryMetaLine } from "./story-meta";

export function storyHref({ to, tags, slug, id }: ArticleType) {
  return (
    to ??
    href("/:category/clanek/:articleId", {
      category: tags[0].toLowerCase(),
      articleId: slug ?? id,
    })
  );
}

/** Shared chrome for photo tiles: rounded frame, focus ring, hover zoom. */
export const tileClassName = cn(
  "group bg-muted relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-primary/10 text-white shadow-xs transition-shadow duration-200",
  "hover:shadow-vidik focus-visible:ring-electricblue focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
);

export const tileImageClassName =
  "absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]";

export function CategoryChip({ tag }: { tag: string }) {
  return (
    <span className="rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-white/90 uppercase">
      {categoryLabel(tag)}
    </span>
  );
}

export function Article(article: ArticleType) {
  const { image, title, tags, biasDistribution, providerKeys } = article;

  return (
    <Link
      to={storyHref(article)}
      prefetch="intent"
      className={cn(tileClassName, "h-[240px]")}
    >
      <img
        src={image.src}
        alt=""
        loading="lazy"
        decoding="async"
        className={tileImageClassName}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 via-55% to-black/0"
      />

      <div className="relative flex p-3">
        {tags[0] && <CategoryChip tag={tags[0]} />}
      </div>

      <div className="relative flex flex-col gap-2 p-3 pt-0">
        <h3 className="line-clamp-3 text-[15px] leading-snug font-semibold text-pretty">
          {title}
        </h3>
        <StoryMetaLine
          providerKeys={providerKeys}
          numberOfArticles={article.numberOfArticles}
          lastPublishedAt={article.lastPublishedAt}
          className="text-white/75"
          stackClassName="border-black/40"
        />
        <BiasBar distribution={biasDistribution} className="mt-0.5" />
      </div>
    </Link>
  );
}
