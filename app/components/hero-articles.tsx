import type { ArticleType } from "~/lib/services/ranking";
import { Article } from "./article";
import ArticleBig from "./article-big";

export default function HeroArticles({
  articles,
}: {
  articles: ArticleType[];
}) {
  return (
    <>
      <ArticleBig {...articles[0]} />
      {articles.slice(1, 6).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
