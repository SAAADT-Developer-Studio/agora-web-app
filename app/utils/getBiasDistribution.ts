import { biasSide } from "~/utils/biasSide";
import type { BiasDistribution } from "~/lib/services/ranking";

export function getBiasDistribution(
  articles: { newsProvider: { biasRating: string | null } }[],
): BiasDistribution {
  const totalCount = articles.filter(
    (a) => a.newsProvider.biasRating !== null,
  ).length;

  const sides = articles.map((a) => biasSide(a.newsProvider.biasRating));
  const leftCount = sides.filter((side) => side === "left").length;
  const centerCount = sides.filter((side) => side === "center").length;
  const rightCount = sides.filter((side) => side === "right").length;

  return {
    leftPercent:
      totalCount > 0 ? Math.round((leftCount / totalCount) * 100) : 0,
    rightPercent:
      totalCount > 0 ? Math.round((rightCount / totalCount) * 100) : 0,
    centerPercent:
      totalCount > 0 ? Math.round((centerCount / totalCount) * 100) : 0,
    leftCount,
    centerCount,
    rightCount,
    totalCount,
  };
}
