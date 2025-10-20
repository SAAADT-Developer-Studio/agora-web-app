import Tag from "./ui/tag";
import CoverageBarBig from "./coverage-bar big";
import { Sources } from "./sources";
import { href, Link } from "react-router";
import type { ArticleType } from "~/lib/services/ranking";
import { useMediaQuery } from "~/hooks/use-media-query";

export default function ArticleBig({
  id,
  slug,
  image,
  title,
  tags,
  biasDistribution,
  numberOfArticles,
  providerKeys,
}: ArticleType) {
  const imageUrl = image.src;

  const isLarge = useMediaQuery("(min-width: 64rem)");

  return (
    <Link
      to={href("/:category/article/:articleId", {
        category: tags[0].toLowerCase(),
        articleId: slug ?? id,
      })}
      prefetch="intent"
      className="contents w-full"
      viewTransition={isLarge}
    >
      <article
        className="border-vidikdarkgray border-px flex h-[300px] w-full cursor-pointer flex-col gap-4 rounded-md bg-cover bg-center transition-transform duration-300 hover:scale-[1.01] sm:col-span-2 sm:row-span-2 md:h-[500px] dark:border-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          viewTransitionName: `article-image-${id}`,
        }}
      >
        <link rel="preload" as="image" fetchPriority="high" href={image.src} />
        <div className="text-vidikwhite flex h-full w-full flex-col items-center justify-between rounded-md [background-image:linear-gradient(to_top,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.55)_15%,rgba(0,0,0,0)_50%)] font-bold">
          <div className="flex w-full items-center justify-between p-2">
            <div className="flex gap-2">
              {tags.map((tag) => (
                <Tag key={tag} text={tag} big />
              ))}
            </div>
            <Sources
              numberOfArticles={numberOfArticles}
              providerKeys={providerKeys}
            />
          </div>
          <div className="flex w-full flex-col items-start justify-center p-2">
            <div className="flex w-full items-center justify-between">
              <p className="md:p-lg my-1 line-clamp-2 w-full overflow-clip text-lg leading-8 md:my-4">
                {title}
              </p>
            </div>

            <CoverageBarBig {...biasDistribution} />
          </div>
        </div>
      </article>
    </Link>
  );
}
