import { Article } from "./article";
import ArticleBig from "./article-big";
import { useMediaQuery } from "~/hooks/use-media-query";
import type { ArticleType } from "~/lib/services/ranking";

export default function HeroArticles({
  articles,
}: {
  articles: ArticleType[];
}) {
  const isLarge = useMediaQuery("(min-width: 64rem)");
  const sliceEnd = isLarge ? 6 : 5;

  return (
    <>
      <ArticleBig {...articles[0]} />
      {articles.slice(1, sliceEnd).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
