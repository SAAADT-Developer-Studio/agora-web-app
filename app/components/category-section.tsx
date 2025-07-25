import { Article } from "./article";
import SectionCard, { type SectionCardProps } from "./section-card";
import { type ArticleType } from "~/routes/home";
import Divider from "./ui/divider";

export type CategorySectionProps = {
  articles: ArticleType[];
  items: SectionCardProps["items"];
  dividerText: string;
  reverse?: boolean;
  sideSectionHeading: string;
};

export default function CategorySection(props: Readonly<CategorySectionProps>) {
  const { articles, items, dividerText, reverse, sideSectionHeading } = props;

  return (
    <>
      <Divider text={dividerText} reverse={reverse} />
      {reverse ? (
        <>
          <SectionCard items={items} heading={sideSectionHeading} />
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      ) : (
        <>
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
          <SectionCard items={items} heading={sideSectionHeading} />
        </>
      )}
      {articles.slice(2, 4).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
