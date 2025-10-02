import type { ArticleType } from "~/lib/services/ranking";
import CoverageBar from "./coverage-bar";
import Tag from "./ui/tag";
import { Link } from "react-router";

export function Article({
  id,
  image,
  title,
  tags,
  showTags,
  leftPercent,
  centerPercent,
  rightPercent,
}: ArticleType) {
  // const imageUrl = `https://wsrv.nl/?url=${image.src}&w=380&h=240`;
  const imageUrl = image.src;
  return (
    <Link to={`/article/${id}`} className="contents w-full">
      <article
        className="border-vidikdarkgray/10 flex h-[240px] w-full cursor-pointer flex-col gap-4 rounded-md border-1 bg-cover bg-center transition-transform duration-300 hover:scale-[1.01] dark:border-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      >
        <div className="text-vidikwhite flex h-full w-full flex-col items-center justify-between rounded-md [background-image:linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.6)_37%,rgba(0,0,0,0)_100%)] text-2xl font-bold">
          <div className="flex h-8 w-[96%] items-center justify-between">
            {showTags && <Tag text={tags[0]} />}
          </div>
          <div className="flex w-[96%] flex-col items-start justify-center py-2">
            <p className="p-sm py-2">{title}</p>
            <CoverageBar
              leftPercent={leftPercent}
              centerPercent={centerPercent}
              rightPercent={rightPercent}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
