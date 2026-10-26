import { biasSide, type BiasSide } from "~/utils/biasSide";

export type BiasCounts = {
  left: number;
  center: number;
  right: number;
  unrated: number;
  total: number;
};

/** Left/center-left → left, right/center-right → right, center → center, no rating → unrated. */
export function countBiasSides(
  ratings: readonly (string | null)[],
): BiasCounts {
  const counts: BiasCounts = {
    left: 0,
    center: 0,
    right: 0,
    unrated: 0,
    total: ratings.length,
  };
  for (const rating of ratings) {
    const side = biasSide(rating);
    if (side === null) counts.unrated += 1;
    else counts[side] += 1;
  }
  return counts;
}

export function biasCountsAddUp(counts: BiasCounts) {
  return (
    counts.left + counts.center + counts.right + counts.unrated === counts.total
  );
}

export type BiasPercents = { left: number; center: number; right: number };

/**
 * Shares of rated outlets only. Unrated outlets stay out of the denominator.
 * Largest remainder keeps the three percents summing to 100.
 */
export function biasPercents(counts: BiasCounts): BiasPercents {
  const parts = [
    { key: "left" as const, count: counts.left },
    { key: "center" as const, count: counts.center },
    { key: "right" as const, count: counts.right },
  ];
  const rated = parts.reduce((sum, part) => sum + part.count, 0);
  if (rated === 0) return { left: 0, center: 0, right: 0 };

  const exact = parts.map((part, index) => {
    const value = (part.count / rated) * 100;
    return { ...part, index, floor: Math.floor(value), frac: value % 1 };
  });
  const percents: BiasPercents = { left: 0, center: 0, right: 0 };
  for (const part of exact) percents[part.key] = part.floor;

  let remainder = 100 - exact.reduce((sum, part) => sum + part.floor, 0);
  const byRemainder = exact
    .slice()
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const part of byRemainder) {
    if (remainder <= 0) break;
    percents[part.key] += 1;
    remainder -= 1;
  }
  return percents;
}

export function biasSideLabel(side: BiasSide | null) {
  if (side === "left") return "LEVO";
  if (side === "right") return "DESNO";
  if (side === "center") return "CENTER";
  return "neopredeljen";
}

export function biasSideName(side: BiasSide | null) {
  if (side === "left") return "Levo";
  if (side === "right") return "Desno";
  if (side === "center") return "Center";
  return "Neopredeljen";
}
