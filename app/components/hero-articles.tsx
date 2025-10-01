import { useEffect, useState } from "react";
import { Article } from "./article";
import ArticleBig from "./article-big";
import { type ArticleType } from "~/routes/home";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export default function HeroArticles(
  props: Readonly<{
    articles: ArticleType[];
  }>,
) {
  const { articles } = props;

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
