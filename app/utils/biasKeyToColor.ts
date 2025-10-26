import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToColor(biasKey: string) {
  const biasMap = {
    left: "bg-[#FA2D36]",
    "center-left": "bg-[#FF6166]",
    center: "bg-[#FEFFFF] !text-black",
    "center-right": "bg-[#52A1FF]",
    right: "bg-[#2D7EFF]",
  } satisfies Record<BiasRating, string>;

  return biasMap[biasKey as BiasRating] || "bg-foreground text-primary";
}
