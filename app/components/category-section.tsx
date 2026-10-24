import { ArrowRight } from "lucide-react";
import { href, Link } from "react-router";
import { Article } from "./article";
import { categoryLabel } from "./story-meta";
import type { ArticleType } from "~/lib/services/ranking";
import type { CategoryKeyValue } from "~/config";

export function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="col-span-full mt-4 flex items-end justify-between gap-4 md:mt-6">
      <div className="min-w-0">
        <h2
          id={id}
          className="text-primary text-xl font-bold tracking-tight md:text-2xl"
        >
          {title}
        </h2>
        {description && (
          <p className="text-primary/60 mt-1 text-sm text-pretty">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function CategorySection({
  articles,
  categoryKey,
  sideSection,
}: {
  articles: ArticleType[];
  categoryKey: CategoryKeyValue;
  sideSection?: React.ReactNode;
}) {
  if (articles.length === 0) return null;
  const headingId = `section-${categoryKey}`;

  return (
    <section aria-labelledby={headingId} className="contents">
      <SectionHeading
        id={headingId}
        title={categoryLabel(categoryKey)}
        action={
          <Link
            to={href("/:category", { category: categoryKey })}
            className="text-primary/60 hover:text-electricblue group flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
          >
            Vse novice
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      {!sideSection ? (
        articles
          .slice(0, 6)
          .map((article) => <Article key={article.id} {...article} />)
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
    </section>
  );
}
