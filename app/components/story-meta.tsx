import { ProviderImage } from "~/components/provider-image";
import { getCategory, isCategoryKey } from "~/config";
import { cn } from "~/lib/utils";
import type { BiasDistribution } from "~/lib/services/ranking";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

/** "POLITIKA" → "Politika"; unknown keys fall back to the raw tag. */
export function categoryLabel(tag: string) {
  const name = isCategoryKey(tag) ? getCategory(tag).name : tag;
  const lower = name.toLocaleLowerCase("sl-SI");
  return lower.charAt(0).toLocaleUpperCase("sl-SI") + lower.slice(1);
}

export function sourcesLabel(count: number) {
  const mod = count % 100;
  if (mod === 1) return `${count} vir`;
  if (mod === 2) return `${count} vira`;
  if (mod === 3 || mod === 4) return `${count} viri`;
  return `${count} virov`;
}

export function articlesLabel(count: number) {
  const mod = count % 100;
  if (mod === 1) return `${count} članek`;
  if (mod === 2) return `${count} članka`;
  if (mod === 3 || mod === 4) return `${count} članki`;
  return `${count} člankov`;
}

/** Overlapping outlet logos, newest-ranked first. */
export function SourceStack({
  providerKeys,
  max = 3,
  className,
}: {
  providerKeys: string[];
  max?: number;
  className?: string;
}) {
  return (
    <span className="flex shrink-0 items-center">
      {providerKeys.slice(0, max).map((key) => (
        <ProviderImage
          key={key}
          provider={{ key, name: key }}
          loading="lazy"
          className={cn(
            "-ml-1.5 size-5 rounded-full border-2 bg-white object-contain first:ml-0",
            className,
          )}
        />
      ))}
    </span>
  );
}

/** "24 člankov · 12 virov · pred 2 urama", the line every story tile carries. */
export function StoryMetaLine({
  providerKeys,
  numberOfArticles,
  lastPublishedAt,
  className,
  stackClassName,
}: {
  providerKeys: string[];
  numberOfArticles: number;
  lastPublishedAt?: string;
  className?: string;
  stackClassName?: string;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2 text-xs font-medium",
        className,
      )}
    >
      <SourceStack providerKeys={providerKeys} className={stackClassName} />
      <span className="truncate">
        {articlesLabel(numberOfArticles)} · {sourcesLabel(providerKeys.length)}
        {lastPublishedAt && (
          <span suppressHydrationWarning>
            {" · "}
            {timeDiffInSlovenian(new Date(lastPublishedAt))}
          </span>
        )}
      </span>
    </span>
  );
}

const sides = [
  { key: "left", label: "Leva", short: "L" },
  { key: "center", label: "Center", short: "C" },
  { key: "right", label: "Desna", short: "D" },
] as const;

/** Segmented left / center / right coverage bar, optionally labelled. */
export function BiasBar({
  distribution,
  labels = false,
  className,
}: {
  distribution: BiasDistribution;
  labels?: boolean;
  className?: string;
}) {
  const percents = {
    left: distribution.leftPercent,
    center: distribution.centerPercent,
    right: distribution.rightPercent,
  };
  const label = sides
    .map((side) => `${side.label} ${percents[side.key]} %`)
    .join(", ");

  const visible = sides.filter((side) => percents[side.key] > 0);

  return (
    <div className={cn("w-full", className)}>
      {/* Labels share the bar's widths and gap so each sits over its segment. */}
      {labels && distribution.totalCount > 0 && (
        <div
          aria-hidden
          className="mb-1.5 flex gap-0.5 text-xs font-semibold tabular-nums"
        >
          {visible.map((side) => (
            <span
              key={side.key}
              className="min-w-0 overflow-hidden whitespace-nowrap"
              style={{ width: `${percents[side.key]}%` }}
            >
              {percents[side.key] >= 20 && (
                <span className="opacity-70">{side.label} </span>
              )}
              {percents[side.key]} %
            </span>
          ))}
        </div>
      )}
      <div
        role="img"
        aria-label={`Pokritost: ${label}`}
        className="flex h-1.5 gap-0.5 overflow-hidden rounded-full"
      >
        {distribution.totalCount === 0 ? (
          <div className="h-full w-full bg-current/20" />
        ) : (
          visible.map((side) => (
            <div
              key={side.key}
              className={cn("h-full border-0", biasKeyToColor(side.key))}
              style={{ width: `${percents[side.key]}%` }}
            />
          ))
        )}
      </div>
    </div>
  );
}
