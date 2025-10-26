export const BiasRatingKey = {
  Left: "left",
  CenterLeft: "center-left",
  Center: "center",
  CenterRight: "center-right",
  Right: "right",
} as const;

export type BiasRating = (typeof BiasRatingKey)[keyof typeof BiasRatingKey];
