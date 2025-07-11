import { SquareArrowOutUpRight } from "lucide-react";
import Tag from "./ui/tag";
import type { ArticleProps } from "./article";
import CoverageBarBig from "./coverage-bar big";

export default function ArticleBig(props: Readonly<ArticleProps>) {
  const { image, title, tags, leftPercent, centerPercent, rightPercent } =
    props;

  return (
    <article
      className="flex h-[480px] w-full flex-col gap-4 rounded-lg bg-cover bg-center sm:col-span-2 sm:row-span-2"
      style={{
        backgroundImage: `url(${image.src})`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-between bg-[linear-gradient(to_top,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0.6)_37%,_rgba(0,0,0,0)_100%)] text-3xl font-bold text-white">
        <div className="flex h-10 w-[98%] items-center justify-between">
          <div className="flex gap-2">
            {tags.map((tag) => (
              <Tag key={tag} text={tag} big />
            ))}
          </div>
          <div className="bg-deepblue border-blue flex rounded-md p-1 opacity-70">
            <SquareArrowOutUpRight width={22} height={22} />
          </div>
        </div>
        <div className="flex w-[98%] flex-col items-start justify-center py-2">
          <p className="p-xl py-4">{title}</p>
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
