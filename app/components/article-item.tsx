import { Newspaper, Clock, NotebookPen, DollarSign } from "lucide-react";
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
  return (
    <>
      <ArticleItemDesktop article={article} className="hidden md:block" />
      <ArticleItemMobile article={article} className="block md:hidden" />
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
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 overflow-hidden text-xs">
              <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 text-[10px] font-medium tracking-wider uppercase">
                <Newspaper className="size-3" />
                {article.newsProvider.name}
              </span>
              <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 text-[10px] font-medium tracking-wider uppercase">
                <Clock className="size-3" />
                {timeDiffInSlovenian(publishDate)}
              </span>
              {article.author && (
                <>
                  <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 text-[10px] font-medium tracking-wider uppercase">
                    <NotebookPen className="size-3" />
                    {article.author}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {article.isPaywalled && <PaywallIcon triggerClassName="size-4" />}
              <div
                className={`flex h-[25.33px] items-center justify-center rounded-sm px-3 py-1 text-xs font-medium whitespace-nowrap uppercase ${biasKeyToColor(article.newsProvider.biasRating ?? "", true)}`}
              >
                {biasKeyToLabel(article.newsProvider.biasRating ?? "")}
              </div>
            </div>
          </div>

          <h3 className="text-primary group-hover:text-accent text-md mb-2 line-clamp-1 leading-snug font-semibold text-pretty transition-colors md:text-lg">
            {article.title.replaceAll("&quot;", '"')}
          </h3>

          {article.summary && (
            <p className="text-muted-foreground text-primary/70 line-clamp-3 text-xs leading-relaxed text-pretty md:text-sm">
              {article.summary}
            </p>
          )}
          <time
            dateTime={article.publishedAt}
            className="text-primary/70 absolute right-4 bottom-4 text-[10px]"
          >
            {publishDate.toLocaleDateString("sl-SI", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ob{" "}
            {publishDate.toLocaleTimeString("sl-SI", {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
          <div className="text-muted-foreground flex max-h-[22px] flex-wrap items-center gap-1 overflow-hidden text-xs">
            <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex h-[22px] items-center gap-1.5 rounded-sm border px-1 py-1 text-[8px] font-medium tracking-wider uppercase">
              <Newspaper className="size-2" />
              {article.newsProvider.name}
            </span>
            <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex h-[22px] items-center gap-1.5 rounded-sm border px-1 py-1 text-[8px] font-medium tracking-wider uppercase">
              <Clock className="size-2" />
              {timeDiffInSlovenian(publishDate)}
            </span>
            {article.author && (
              <>
                <span className="bg-vidikgreen/60 border-vidikgreen text-primary flex h-[22px] items-center gap-1.5 rounded-sm border px-1 py-1 text-[8px] font-medium tracking-wider uppercase">
                  <NotebookPen className="size-2" />
                  {article.author}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-1">
            {article.isPaywalled && <PaywallIcon triggerClassName="size-3" />}
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
          <h3 className="text-primary text-md line-clamp-3 leading-snug font-semibold text-pretty transition-colors md:text-lg">
            {article.title.replaceAll("&quot;", '"')}
          </h3>
        </div>

        <div className="mb-8 w-full">
          {article.summary && (
            <p className="text-muted-foreground text-primary/70 line-clamp-3 text-xs leading-relaxed text-pretty md:text-sm">
              {article.summary}
            </p>
          )}
          <time
            dateTime={article.publishedAt}
            className="text-primary/70 absolute right-2 bottom-2 text-[10px]"
          >
            {publishDate.toLocaleDateString("sl-SI", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ob{" "}
            {publishDate.toLocaleTimeString("sl-SI", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>
    </a>
  );
}

function PaywallIcon({ triggerClassName }: { triggerClassName?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <DollarSign className={triggerClassName} />
      </TooltipTrigger>
      <TooltipContent>
        <span>Članek je plačljiv</span>
      </TooltipContent>
    </Tooltip>
  );
}
