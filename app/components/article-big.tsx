import Tag from "./ui/tag";
import CoverageBarBig from "./coverage-bar big";
import { Sources } from "./sources";
import type { ArticleType } from "~/routes/home";

export default function ArticleBig(props: Readonly<ArticleType>) {
  const {
    image,
    title,
    tags,
    leftPercent,
    centerPercent,
    rightPercent,
    numberOfArticles,
  } = props;

  props;

  const imageUrl = `https://wsrv.nl/?url=${image.src}&w=600&h=400`;

  return (
    <article
      className="border-vidikdarkgray border-px flex h-[500px] w-full cursor-pointer flex-col gap-4 rounded-md bg-cover bg-center transition-transform duration-300 hover:scale-[1.01] sm:col-span-2 sm:row-span-2 dark:border-0"
      style={{
        backgroundImage: `url(${imageUrl})`,
      }}
    >
      <link rel="preload" as="image" fetchPriority="high" href={image.src} />
      <div className="text-vidikwhite flex h-full w-full flex-col items-center justify-between rounded-md [background-image:linear-gradient(to_top,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.5)_15%,rgba(0,0,0,0)_50%)] text-3xl font-bold">
        <div className="flex h-10 w-[98%] items-center justify-between">
          <div className="flex gap-2">
            {tags.map((tag) => (
              <Tag key={tag} text={tag} big />
            ))}
          </div>
        </div>
        <div className="flex w-[96%] flex-col items-start justify-center py-2">
          <div className="flex w-full items-center justify-between">
            <p className="p-lg w-[80%] py-6">{title}</p>
            {/* TODO: rename */}
            <Sources numberOfArticles={numberOfArticles} />
          </div>

          <CoverageBarBig
            leftPercent={leftPercent}
            centerPercent={centerPercent}
            rightPercent={rightPercent}
          />
        </div>
      </div>
    </article>
  );
}
