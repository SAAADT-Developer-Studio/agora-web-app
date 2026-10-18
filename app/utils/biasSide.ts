import { BiasRatingKey } from "~/enums/biasRatingKey";

export type BiasSide = "left" | "center" | "right";

/** Collapses the five bias ratings into left / center / right. */
export function biasSide(biasRating: string | null): BiasSide | null {
  switch (biasRating) {
    case BiasRatingKey.Left:
    case BiasRatingKey.CenterLeft:
      return "left";
    case BiasRatingKey.Center:
      return "center";
    case BiasRatingKey.CenterRight:
    case BiasRatingKey.Right:
      return "right";
    default:
      return null;
  }
}
