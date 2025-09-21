import { Article } from "./article";
import PeopleCard, { type PeopleCardProps } from "./people-card";
import { type ArticleType } from "~/routes/home";
import Divider from "./ui/divider";
import EconomyCard, {
  type EconomyCardProps,
  type GDPSeries,
} from "./economy-card";

export type CategorySectionProps = {
  articles: ArticleType[];
  items?: PeopleCardProps["items"];
  dividerText: string;
  reverse?: boolean;
  sideSectionHeading?: string;
  sideSectionType?: SectionCardType;
  gdpSeries?: EconomyCardProps["gdpSeries"];
};

export enum SectionCardType {
  Economy = "Economy",
  People = "People",
}

type SideSectionProps = {
  sideSectionType?: SectionCardType;
  items?: PeopleCardProps["items"];
  heading?: string;
  gdpSeries?: GDPSeries[];
};

const SideSection = ({
  sideSectionType,
  items,
  heading,
  gdpSeries,
}: SideSectionProps) => {
  if (!sideSectionType) return null;

  switch (sideSectionType) {
    case SectionCardType.Economy:
      return gdpSeries ? <EconomyCard gdpSeries={gdpSeries} /> : null;
    case SectionCardType.People:
      return items && heading ? (
        <PeopleCard items={items} heading={heading} />
      ) : null;
    default:
      return null;
  }
};

export default function CategorySection(props: Readonly<CategorySectionProps>) {
  const {
    gdpSeries,
    articles,
    items,
    dividerText,
    reverse,
    sideSectionHeading,
    sideSectionType,
  } = props;

  return (
    <>
      <Divider text={dividerText} reverse={reverse} />
      {reverse ? (
        <>
          <SideSection
            sideSectionType={sideSectionType}
            items={items}
            heading={sideSectionHeading}
            gdpSeries={gdpSeries}
          />
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
        </>
      ) : (
        <>
          {articles.slice(0, 2).map((article) => (
            <Article key={article.id} {...article} />
          ))}
          <SideSection
            sideSectionType={sideSectionType}
            items={items}
            heading={sideSectionHeading}
            gdpSeries={gdpSeries}
          />
        </>
      )}
      {articles.slice(2, 4).map((article) => (
        <Article key={article.id} {...article} />
      ))}
    </>
  );
}
