import { Article } from "./article";
import ArticleBig from "./article-big";
import { type ArticleType } from "~/routes/home";

export default function HeroArticles(
  props: Readonly<{
    articles: ArticleType[];
  }>,
) {
  const { articles } = props;

  return (
    <>
      <ArticleBig {...articles[0]} />
      {articles.slice(1, 6).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
