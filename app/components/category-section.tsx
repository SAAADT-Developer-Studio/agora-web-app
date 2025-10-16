import { Article } from "./article";
import Divider from "./ui/divider";
import type { ArticleType } from "~/lib/services/ranking";

export default function CategorySection({
  articles,
  dividerText,
  sideSection,
}: {
  articles: ArticleType[];
  dividerText: string;
  sideSection?: React.ReactNode;
}) {
  return (
    <>
      <Divider text={dividerText} />
      {!sideSection ? (
        <>
          {articles.slice(0, 6).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      ) : (
        <>
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
          {sideSection}
          {articles.slice(2, 4).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      )}
    </>
  );
}
