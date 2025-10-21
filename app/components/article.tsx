import type { ArticleType } from "~/lib/services/ranking";
import CoverageBar from "./coverage-bar";
import Tag from "./ui/tag";
import { href, Link } from "react-router";
import { Newspaper } from "lucide-react";
import { cn } from "~/lib/utils";

export function Article({
  id,
  slug,
  image,
  title,
  tags,
  biasDistribution,
  numberOfArticles,
}: ArticleType) {
  // const imageUrl = `https://wsrv.nl/?url=${image.src}&w=380&h=240`;
  const imageUrl = image.src;
  return (
    <Link
      to={href("/:category/clanek/:articleId", {
        category: tags[0].toLowerCase(),
        articleId: slug ?? id,
      })}
      prefetch="intent"
      className="contents w-full"
    >
      <article className="group border-vidikdarkgray/10 relative flex h-[240px] w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-md border-1 dark:border-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-400 group-hover:scale-103"
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        />
        <div className="text-vidikwhite relative z-10 flex h-full w-full flex-col items-center justify-between rounded-md [background-image:linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.6)_37%,rgba(0,0,0,0)_100%)] text-2xl font-bold">
          <div className="flex h-8 w-full items-center justify-between p-2">
            <div className="flex max-h-[21px] flex-wrap gap-2 overflow-hidden">
              {tags.map((tag) => (
                <Tag key={tag} text={tag} big />
              ))}
            </div>
            <ArticleCount count={numberOfArticles} />
          </div>
          <div className="flex w-full flex-col items-start justify-center p-2">
            <p className="p-sm my-2 line-clamp-2 overflow-clip">{title}</p>
            <CoverageBar {...biasDistribution} />
          </div>
        </div>
      </article>
    </Link>
  );
}

function ArticleCount({ count }: { count: number }) {
  return (
    <div
      className={cn(
        "flex scale-[0.99] items-center gap-1 rounded bg-black/50 px-1 text-sm text-white opacity-0 transition duration-300",
        "group-hover:scale-[1] group-hover:opacity-100",
      )}
    >
      <Newspaper className="size-3" />
      {count}
    </div>
  );
}
