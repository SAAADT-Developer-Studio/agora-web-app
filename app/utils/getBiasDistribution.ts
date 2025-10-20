import type { BiasDistribution } from "~/lib/services/ranking";

export function getBiasDistribution(
  articles: { newsProvider: { biasRating: string | null } }[],
): BiasDistribution {
  const totalCount = articles.filter(
    (a) => a.newsProvider.biasRating !== null,
  ).length;

  const leftCount = articles.filter(
    (a) =>
      a.newsProvider.biasRating &&
      ["left", "center-left"].includes(a.newsProvider.biasRating),
  ).length;

  const centerCount = articles.filter(
    (a) => a.newsProvider.biasRating === "center",
  ).length;

  const rightCount = articles.filter(
    (a) =>
      a.newsProvider.biasRating &&
      ["right", "center-right"].includes(a.newsProvider.biasRating),
  ).length;

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
