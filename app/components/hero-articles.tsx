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
      {articles.slice(1, 5).map((article) => (
        <Article key={article.id} {...article} />
      ))}
      {articles[5] && (
        <div className="hidden lg:block">
          <Article key={articles[5].id} {...articles[5]} />
        </div>
      )}
    </>
  );
}
