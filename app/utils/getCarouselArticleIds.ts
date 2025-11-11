import { BiasRatingKey } from "~/enums/biasRatingKey";

export type ArticleData = {
  id: number;
  imageUrls: string[] | null;
  newsProvider: {
    rank: number;
    biasRating: string | null;
  };
};
export function getCarouselArticleIds(articles: Array<ArticleData>): number[] {
  const filteredArticles = [...articles].filter(
    (article) =>
      article.imageUrls &&
      article.imageUrls.length > 0 &&
      !article.imageUrls[0].toLowerCase().endsWith(".mp4"),
  );

  const articlesByRank = new Map<number, Array<ArticleData>>();

  for (const article of filteredArticles) {
    const rank = article.newsProvider.rank;
    if (!articlesByRank.has(rank)) {
      articlesByRank.set(rank, []);
    }
    articlesByRank.get(rank)!.push(article);
  }

  const sortedRanks = Array.from(articlesByRank.keys()).sort((a, b) => a - b);

  const result: number[] = [];

  for (const rank of sortedRanks) {
    const articlesAtRank = articlesByRank.get(rank)!;
    const sides = [
      BiasRatingKey.Left,
      BiasRatingKey.CenterLeft,
      BiasRatingKey.Center,
      BiasRatingKey.CenterRight,
      BiasRatingKey.Right,
    ].flatMap((side) => {
      return articlesAtRank.filter((a) => a.newsProvider.biasRating === side);
    });
    let isLeft = true;
    while (sides.length > 0) {
      if (isLeft) {
        result.push(sides.pop()!.id);
      } else {
        result.push(sides.shift()!.id);
      }
      isLeft = !isLeft;
    }
    result.push(
      ...articlesAtRank
        .filter((a) => a.newsProvider.biasRating === null)
        .map((a) => a.id),
    );
  }

  return result;
}
