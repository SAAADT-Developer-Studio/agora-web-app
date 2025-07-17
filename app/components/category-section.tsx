import { Article } from "./article";
import HighlightedPeople, {
  type HighlightedPeopleProps,
} from "./highlighted-people";
import Divider from "./ui/divider";
import { type ArticleType } from "~/routes/home";

export type CategorySectionProps = {
  articles: ArticleType[];
  people: HighlightedPeopleProps["people"];
  dividerText: string;
  reverse?: boolean;
};

export default function CategorySection(props: Readonly<CategorySectionProps>) {
  const { articles, people, dividerText, reverse } = props;

  return (
    <>
      <Divider text={dividerText} reverse={reverse} />
      {reverse ? (
        <>
          <HighlightedPeople people={people} />
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      ) : (
        <>
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
          <HighlightedPeople people={people} />
        </>
      )}
      {articles.slice(2, 4).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
