import fallback from "~/assets/fallback.png";
import {
  getCarouselArticleIds,
  type ArticleData,
} from "~/utils/getCarouselArticleIds";

export function extractHeroImage(articles: ArticleData[]) {
  const articleId = getCarouselArticleIds(articles).at(0);
  return articles.find((a) => a.id === articleId)?.imageUrls?.[0] || fallback;
}

/** Lead images in carousel order (same spread across sources as the hero), deduplicated. */
export function extractCarouselImages(articles: ArticleData[], max = 6) {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const images = new Set<string>();
  for (const id of getCarouselArticleIds(articles)) {
    const url = byId.get(id)?.imageUrls?.[0];
    if (url) images.add(url);
    if (images.size >= max) break;
  }
  return [...images];
}
