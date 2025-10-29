import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToColor(biasKey: string) {
  const biasMap = {
    left: "bg-[#FA2D36] text-white",
    "center-left": "bg-[#FF6166] text-white",
    center:
      "bg-[#FEFFFF] !text-black border border-black/10 dark:border-transparent",
    "center-right": "bg-[#52A1FF] text-white",
    right: "bg-[#2D7EFF] text-white",
  } satisfies Record<BiasRating, string>;

  return biasMap[biasKey as BiasRating] || "bg-foreground text-primary";
}
