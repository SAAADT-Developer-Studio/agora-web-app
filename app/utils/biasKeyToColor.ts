import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToColor(biasKey: string, withOpacity = false): string {
  const biasMapOpaque = {
    left: "bg-bias-left text-white",
    "center-left": "bg-bias-center-left text-black",
    center: "bg-bias-center text-black border border-black/10",
    "center-right": "bg-bias-center-right text-black",
    right: "bg-bias-right text-white",
  } satisfies Record<BiasRating, string>;

  const biasMapWithOpacity = {
    left: "bg-bias-left/70 border md:border-2 border-bias-left text-white",
    "center-left":
      "bg-bias-center-left/70 border md:border-2 border-bias-center-left text-black",
    center:
      "bg-bias-center/90 border md:border-2 border-black/10 dark:border-bias-center text-black",
    "center-right":
      "bg-bias-center-right/70 border md:border-2 border-bias-center-right text-black",
    right: "bg-bias-right/70 border md:border-2 border-bias-right text-white",
  } satisfies Record<BiasRating, string>;

  const biasMap = withOpacity ? biasMapWithOpacity : biasMapOpaque;

  const defaultClass = withOpacity
    ? "bg-surface-light/70 border-1 md:border-2 border-surface-light text-surface-light-text"
    : "bg-surface-light text-surface-light-text border border-current/10";

  return biasMap[biasKey as BiasRating] ?? defaultClass;
}
