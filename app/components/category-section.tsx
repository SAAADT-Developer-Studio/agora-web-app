import { Article } from "./article";
import Divider from "./ui/divider";
import type { ArticleType } from "~/lib/services/ranking";

export default function CategorySection({
  articles,
  dividerText,
  reverse,
  sideSection,
}: {
  articles: ArticleType[];
  dividerText: string;
  reverse?: boolean;
  sideSection: React.ReactNode;
}) {
  return (
    <>
      <Divider text={dividerText} reverse={reverse} />
      {reverse ? (
        <>
          {sideSection}
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      ) : (
        <>
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
          {sideSection}
        </>
      )}
      {articles.slice(2, 4).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
