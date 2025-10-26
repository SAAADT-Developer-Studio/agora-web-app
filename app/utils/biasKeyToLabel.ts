import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToLabel(biasKey: string) {
  const biasMap: Record<string, string> = {
    left: "levo",
    "center-left": "center levo",
    center: "center",
    "center-right": "center desno",
    right: "desno",
  } satisfies Record<BiasRating, string>;

  return biasMap[biasKey] || "neznano";
}
