import { Link } from "react-router";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import { cn } from "~/lib/utils";
import type { ArticleType } from "~/lib/services/ranking";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import type { Blindspots as BlindspotsData } from "~/utils/blindspots";
import { storyHref } from "./article";
import { SectionHeading } from "./category-section";
import { articlesLabel, sourcesLabel } from "./story-meta";

const columns = [
  {
    side: "left",
    title: "Spregledano na desni",
    description: "O zgodbi poročajo skoraj samo levi mediji.",
    empty: "Trenutno ni zgodb, ki bi jih desni mediji spregledali.",
  },
  {
    side: "right",
    title: "Spregledano na levi",
    description: "O zgodbi poročajo skoraj samo desni mediji.",
    empty: "Trenutno ni zgodb, ki bi jih levi mediji spregledali.",
  },
] as const;

export function Blindspots({ blindspots }: { blindspots: BlindspotsData }) {
  if (blindspots.left.length === 0 && blindspots.right.length === 0)
    return null;

  return (
    <section aria-labelledby="blindspots" className="contents">
      <SectionHeading
        id="blindspots"
        title="Spregledane zgodbe"
        description="Zgodbe, o katerih poroča večinoma ena stran političnega spektra."
        action={<BiasInfoTooltip />}
      />
      <div className="col-span-full grid gap-3 md:grid-cols-2 md:gap-5">
        {columns.map((column) => (
          <div
            key={column.side}
            className="bg-surface-light border-primary/10 rounded-xl border p-4 shadow-xs md:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-full border-0",
                  biasKeyToColor(column.side),
                )}
              />
              <h3 className="text-primary font-bold tracking-wide uppercase">
                {column.title}
              </h3>
            </div>
            <p className="text-primary/60 -mt-2 mb-3 text-sm">
              {column.description}
            </p>

            {blindspots[column.side].length === 0 ? (
              <p className="text-primary/50 py-6 text-center text-sm">
                {column.empty}
              </p>
            ) : (
              <ul className="divide-primary/10 -mx-2 divide-y">
                {blindspots[column.side].map((story) => (
                  <li key={story.id}>
                    <BlindspotRow story={story} side={column.side} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function BlindspotRow({
  story,
  side,
}: {
  story: ArticleType;
  side: "left" | "right";
}) {
  const { biasDistribution: d } = story;
  const percent = side === "left" ? d.leftPercent : d.rightPercent;

  return (
    <Link
      to={storyHref(story)}
      prefetch="intent"
      className="group focus-visible:ring-electricblue hover:bg-primary/[0.04] flex gap-3 rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <img
        src={story.image.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="bg-primary/5 aspect-[4/3] w-20 shrink-0 self-start rounded-md object-cover sm:w-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-primary group-hover:text-electricblue line-clamp-2 leading-snug font-semibold text-pretty transition-colors">
          {story.title}
        </p>
        <div className="mt-auto flex items-center gap-2.5 text-xs">
          <div className="bg-primary/10 h-1.5 w-16 shrink-0 overflow-hidden rounded-full sm:w-20">
            <div
              className={cn("h-full border-0", biasKeyToColor(side))}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-primary font-semibold tabular-nums">
            {side === "left" ? "Leva" : "Desna"} {percent} %
          </span>
          <span className="text-primary/50 truncate">
            {articlesLabel(story.numberOfArticles)} ·{" "}
            {sourcesLabel(story.providerKeys.length)}
          </span>
        </div>
      </div>
    </Link>
  );
}
