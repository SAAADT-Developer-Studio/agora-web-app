import {
  Newspaper,
  Clock,
  NotebookPen,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { ProviderImage } from "~/components/provider-image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import type { ArticlePageData } from "~/routes/article";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

type Article = ArticlePageData["cluster"]["articles"][number];

export function ArticleItem({ article }: { article: Article }) {
  const formattedArticle = {
    ...article,
    title: article.title.replaceAll("&quot;", '"'),
  };
  return (
    <>
      <ArticleItemDesktop
        article={formattedArticle}
        className="hidden scroll-mt-32 md:block"
      />
      <ArticleItemMobile
        article={formattedArticle}
        className="block md:hidden"
      />
    </>
  );
}

function ArticleItemDesktop({
  article,
  className,
}: {
  article: Article;
  className: string;
}) {
  const publishDate = new Date(article.publishedAt);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      id={`article-${article.id}`}
      className={cn(
        "group bg-primary/5 border-primary/10 hover:bg-primary/9 relative rounded-lg border p-4 transition-colors duration-200",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <ProviderImage
            provider={article.newsProvider}
            size={160}
            className="border-primary/10 h-[60px] w-[60px] rounded-lg border md:h-[160px] md:w-[160px]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 overflow-hidden text-xs">
              <ArticleMetadataBadge icon={Newspaper}>
                {article.newsProvider.name}
              </ArticleMetadataBadge>
              <ArticleMetadataBadge icon={Clock}>
                {timeDiffInSlovenian(publishDate)}
              </ArticleMetadataBadge>
              {article.author && (
                <ArticleMetadataBadge icon={NotebookPen}>
                  {article.author}
                </ArticleMetadataBadge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {article.isPaywalled && <PaywallIcon className="size-4" />}
              <div
                className={`flex h-[25.33px] items-center justify-center rounded-sm px-3 py-1 text-xs font-medium whitespace-nowrap uppercase ${biasKeyToColor(article.newsProvider.biasRating ?? "", true)}`}
              >
                {biasKeyToLabel(article.newsProvider.biasRating ?? "")}
              </div>
            </div>
          </div>

          <h3
            className="text-primary group-hover:text-accent text-md mb-2 line-clamp-1 leading-snug font-semibold text-pretty transition-colors md:text-lg"
            title={article.title}
          >
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-primary/70 line-clamp-3 text-xs leading-relaxed text-pretty md:text-sm">
              {article.summary}
            </p>
          )}
          <time
            dateTime={article.publishedAt}
            className="text-primary/70 absolute right-4 bottom-4 text-[10px]"
          >
            {formatArticleDate(publishDate)}
          </time>
        </div>
      </div>
    </a>
  );
}

function ArticleItemMobile({
  article,
  className,
}: {
  article: Article;
  className: string;
}) {
  const publishDate = new Date(article.publishedAt);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "bg-primary/5 border-primary/10 relative rounded-lg border p-2",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex max-h-[22px] flex-wrap items-center gap-1 overflow-hidden text-xs">
            <ArticleMetadataBadge
              icon={Newspaper}
              className="h-[22px] border px-1 py-1 text-[8px]"
              iconClassName="size-2"
            >
              {article.newsProvider.name}
            </ArticleMetadataBadge>
            <ArticleMetadataBadge
              icon={Clock}
              className="h-[22px] border px-1 py-1 text-[8px]"
              iconClassName="size-2"
            >
              {timeDiffInSlovenian(publishDate)}
            </ArticleMetadataBadge>
            {article.author && (
              <ArticleMetadataBadge
                icon={NotebookPen}
                className="h-[22px] border px-1 py-1 text-[8px]"
                iconClassName="size-2"
              >
                {article.author}
              </ArticleMetadataBadge>
            )}
          </div>
          <div className="flex gap-1">
            {article.isPaywalled && <PaywallIcon className="size-3" />}
            <div
              className={`flex items-center justify-center rounded-sm px-1 py-1 text-[8px] font-medium whitespace-nowrap uppercase ${biasKeyToColor(article.newsProvider.biasRating ?? "", true)}`}
            >
              {biasKeyToLabel(article.newsProvider.biasRating ?? "")}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <ProviderImage
            provider={article.newsProvider}
            size={160}
            className="border-primary/10 h-[70px] w-[70px] rounded-lg border"
          />
          <h3
            className="text-primary text-md line-clamp-3 leading-snug font-semibold text-pretty transition-colors md:text-lg"
            title={article.title}
          >
            {article.title}
          </h3>
        </div>

        <div className="mb-8 w-full">
          {article.summary && (
            <p className="text-primary/70 line-clamp-3 text-xs leading-relaxed text-pretty md:text-sm">
              {article.summary}
            </p>
          )}
          <time
            dateTime={article.publishedAt}
            className="text-primary/70 absolute right-2 bottom-2 text-[10px]"
          >
            {formatArticleDate(publishDate)}
          </time>
        </div>
      </div>
    </a>
  );
}

function ArticleMetadataBadge({
  icon: Icon,
  children,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "bg-vidikgreen/60 border-vidikgreen text-primary flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 text-[10px] font-medium tracking-wider uppercase",
        className,
      )}
    >
      <Icon className={cn("size-3", iconClassName)} />
      {children}
    </span>
  );
}

function PaywallIcon({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <DollarSign className={className} />
      </TooltipTrigger>
      <TooltipContent>
        <span>Članek je plačljiv</span>
      </TooltipContent>
    </Tooltip>
  );
}

function formatArticleDate(date: Date): string {
  return `${date.toLocaleDateString("sl-SI", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ob ${date.toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
