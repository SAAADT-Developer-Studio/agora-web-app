import fallback from "~/assets/fallback.png";
import {
  getCarouselArticleIds,
  type ArticleData,
} from "~/utils/getCarouselArticleIds";

export function extractHeroImage(articles: ArticleData[]) {
  const articleId = getCarouselArticleIds(articles).at(0);
  return articles.find((a) => a.id === articleId)?.imageUrls?.[0] || fallback;
}
