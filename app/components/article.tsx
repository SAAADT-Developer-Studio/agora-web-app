import CoverageBar from "./coverage-bar";
import { SquareArrowOutUpRight } from "lucide-react";
import Tag from "./ui/tag";

export type Image = {
  src: string;
  alt: string;
};

export type ArticleProps = {
  title: string;
  image: Image;
  tags: string[];
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
  url: string;
};

export function Article(props: Readonly<ArticleProps>) {
  const { image, title, tags } = props;

  return (
    <article
      className="flex h-[230px] w-full flex-col gap-4 rounded-lg bg-cover bg-center"
      style={{
        backgroundImage: `url(${image.src})`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-between bg-[linear-gradient(to_top,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0.6)_37%,_rgba(0,0,0,0)_100%)] text-2xl font-bold text-white">
        <div className="flex h-8 w-[96%] items-center justify-between">
          <Tag text={tags[0]} />
          <div className="bg-deepblue border-blue flex rounded-md p-1 opacity-70">
            <SquareArrowOutUpRight width={15} height={15} />
          </div>
        </div>
        <div className="flex w-[96%] flex-col items-start justify-center py-2">
          <p className="p-md py-2">{title}</p>
          <CoverageBar
            leftPercent={props.leftPercent}
            centerPercent={props.centerPercent}
            rightPercent={props.rightPercent}
          />
        </div>
      </div>
    </article>
  );
}
