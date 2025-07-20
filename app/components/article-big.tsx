import Tag from "./ui/tag";
import type { ArticleProps } from "./article";
import CoverageBarBig from "./coverage-bar big";
import { Sources } from "./sources";

export default function ArticleBig(props: Readonly<ArticleProps>) {
  const { image, title, tags, leftPercent, centerPercent, rightPercent } =
    props;

  return (
    <article
      className="border-vidikdarkgray flex h-[500px] w-full flex-col gap-4 rounded-lg border-[0.5px] bg-cover bg-center transition-transform duration-300 hover:scale-[1.02] sm:col-span-2 sm:row-span-2 dark:border-0"
      style={{
        backgroundImage: `url(${image.src})`,
      }}
    >
      <div className="text-primary flex h-full w-full flex-col items-center justify-between rounded-lg [background-image:linear-gradient(to_top,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.6)_37%,rgba(255,255,255,0)_100%)] text-3xl font-bold dark:[background-image:linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.6)_37%,rgba(0,0,0,0)_100%)]">
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
            <Sources numberOfSources={16} />
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
