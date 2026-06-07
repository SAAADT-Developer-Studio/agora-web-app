import type { BiasRating } from "~/enums/biasRatingKey";

const biasHexColors: Record<BiasRating, string> = {
  left: "#FA2D36",
  "center-left": "#FF6166",
  center: "#9ca3af",
  "center-right": "#52A1FF",
  right: "#2D7EFF",
};

function getBiasHexColor(biasRating?: BiasRating): string {
  return biasRating ? (biasHexColors[biasRating] ?? "#9ca3af") : "#9ca3af";
}

export { getBiasHexColor };
