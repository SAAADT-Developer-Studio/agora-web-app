import type { InferSelectModel } from "drizzle-orm";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router";
import {
  ArrowUpRight,
  Copy,
  DollarSign,
  MessageCircle,
  Share,
  Sparkles,
} from "lucide-react";
import fallbackArticleImage from "~/assets/fallback.png";
import redditIcon from "~/assets/reddit.svg";
import { BiasDistribution } from "~/components/bias-distribution";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import { Icon } from "~/components/icon";
import { ProviderImage } from "~/components/provider-image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { newsProvider } from "~/drizzle/schema";
import { cn } from "~/lib/utils";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { getCarouselArticleIds } from "~/utils/getCarouselArticleIds";
import { groupByDay } from "~/utils/groupByDay";
import { resolvePlural } from "~/utils/resolvePlural";
import { biasSide, type BiasSide } from "~/utils/biasSide";
import type { StoryMention } from "~/utils/socialPost";
import type { StoryBullet } from "~/utils/storySummary";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

export type StoryArticle = {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  summary: string | null;
  newsProviderKey: string;
  author: string | null;
  imageUrls: string[] | null;
  isPaywalled: boolean | null;
  newsProvider: InferSelectModel<typeof newsProvider>;
};

export type StoryPageData = {
  story: {
    id: number;
    title: string;
    bullets: StoryBullet[];
    /** Newest article landed recently enough to call the story developing. */
    isDeveloping: boolean;
  };
  /** Newest first. */
  articles: StoryArticle[];
  mentions: StoryMention[];
  uniqueCategories: string[];
  heroImageUrl: string;
};

const TIME_ZONE = "Europe/Ljubljana";
const timeFormatter = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormatter = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDateFormatter = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

function formatSpan(oldest: Date, newest: Date) {
  const from = shortDateFormatter.format(oldest);
  const to = shortDateFormatter.format(newest);
  if (from === to) {
    const start = timeFormatter.format(oldest);
    const end = timeFormatter.format(newest);
    return start === end ? `${from}, ${start}` : `${from}, ${start}–${end}`;
  }
  return `${from} – ${to}`;
}

type SideFilter = "all" | BiasSide;

/** `dot` is the bias rating whose colour marks the filter chip. */
const biasSides: { key: SideFilter; label: string; dot: string | null }[] = [
  { key: "all", label: "Vsi", dot: null },
  { key: "left", label: "Leva", dot: "left" },
  { key: "center", label: "Center", dot: "center" },
  { key: "right", label: "Desna", dot: "right" },
];

export default function StoryPage({ data }: { data: StoryPageData }) {
  const { story, articles, mentions, uniqueCategories } = data;
  const [side, setSide] = useState<SideFilter>("all");
  // Render the unfiltered timeline before the browser follows an #article-
  // anchor, so a linked article hidden by the bias filter exists to scroll to.
  const showAll = () => flushSync(() => setSide("all"));

  const articlesById = new Map(articles.map((a) => [a.id, a]));
  const providers = uniqueProviders(articles);
  const times = articles.map((a) => Date.parse(a.publishedAt));
  const oldestDate = new Date(Math.min(...times));
  const newestDate = new Date(Math.max(...times));

  const mentionCounts = new Map<number, number>();
  for (const mention of mentions) {
    for (const id of mention.articleIds) {
      mentionCounts.set(id, (mentionCounts.get(id) ?? 0) + 1);
    }
  }

  return (
    <article className="mx-auto max-w-6xl px-1 py-1 md:py-6">
      <nav className="text-primary/60 mb-6 flex items-center gap-3 text-xs font-semibold tracking-widest uppercase md:mb-8">
        <Link to="/" className="text-primary hover:text-electricblue">
          Vidik
        </Link>
        <div className="flex max-h-5 flex-wrap gap-3 overflow-clip">
          {uniqueCategories.slice(0, 3).map((category) => (
            <span className="flex gap-3" key={category}>
              <span aria-hidden>/</span>
              <span>{category}</span>
            </span>
          ))}
        </div>
        <ShareButtons />
      </nav>

      {/* lg: main column (header, hero, coverage) + sidebar. The sidebar spans
          both rows; on narrow screens it falls between hero and coverage. */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <header className="mb-5 md:mb-6">
            <h1 className="text-primary text-[1.65rem] leading-[1.15] font-bold tracking-tight text-balance md:text-4xl lg:text-[2.6rem] lg:leading-[1.08]">
              {story.title}
            </h1>

            <CoverageMeta
              providers={providers}
              articleCount={articles.length}
              newestDate={newestDate}
              isDeveloping={story.isDeveloping}
            />
          </header>

          <HeroImageCarousel
            articles={articles}
            onCaptionClick={showAll}
            title={story.title}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {story.bullets.length > 0 && (
            <KeyPoints
              bullets={story.bullets}
              articlesById={articlesById}
              onSourceClick={showAll}
            />
          )}
          <BiasStrip articles={articles} />
          <div className="hidden lg:sticky lg:top-20 lg:block xl:top-32">
            <BiasDistribution
              biasDistribution={getBiasDistribution(articles)}
              providers={providers}
              className="min-h-80"
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-10">
          {mentions.length > 0 && (
            <SocialMentions mentions={mentions} articlesById={articlesById} />
          )}
          <CoverageTimeline
            articles={articles}
            side={side}
            onSideChange={setSide}
            mentionCounts={mentionCounts}
            oldestDate={oldestDate}
            newestDate={newestDate}
          />
        </div>
      </div>

      <p className="text-primary/50 mx-auto mt-16 max-w-xl text-center text-xs leading-relaxed text-pretty">
        Vidik je to zgodbo samodejno sestavil iz {articles.length}{" "}
        {resolvePlural({
          count: articles.length,
          singular: "članka",
          dual: "člankov",
          plural: "člankov",
        })}{" "}
        {providers.length}{" "}
        {resolvePlural({
          count: providers.length,
          singular: "medija",
          dual: "medijev",
          plural: "medijev",
        })}
        . Članki se dodajajo sproti, ko o dogodku poročajo novi viri.
      </p>
    </article>
  );
}

function uniqueProviders(articles: StoryArticle[]) {
  const byKey = new Map<
    string,
    StoryArticle["newsProvider"] & { articleCount: number }
  >();
  for (const article of articles) {
    const existing = byKey.get(article.newsProviderKey);
    if (existing) existing.articleCount += 1;
    else
      byKey.set(article.newsProviderKey, {
        ...article.newsProvider,
        articleCount: 1,
      });
  }
  return [...byKey.values()].sort(
    (a, b) => b.articleCount - a.articleCount || a.rank - b.rank,
  );
}

function CoverageMeta({
  providers,
  articleCount,
  newestDate,
  isDeveloping,
}: {
  providers: ReturnType<typeof uniqueProviders>;
  articleCount: number;
  newestDate: Date;
  isDeveloping: boolean;
}) {
  const shown = providers.slice(0, 5);
  const hidden = providers.length - shown.length;

  return (
    <div className="text-primary/70 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <div className="flex items-center">
        {shown.map((provider) => (
          <ProviderImage
            key={provider.key}
            provider={provider}
            className="border-surface bg-surface-light -ml-2 size-7 rounded-full border-2 object-contain first:ml-0"
          />
        ))}
        {hidden > 0 && (
          <span className="border-surface bg-primary text-primary-text -ml-2 flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-bold">
            +{hidden}
          </span>
        )}
      </div>
      <span>
        <strong className="text-primary font-semibold">{articleCount}</strong>{" "}
        {resolvePlural({
          count: articleCount,
          singular: "članek",
          dual: "članka",
          plural: "člankov",
        })}{" "}
        iz{" "}
        <strong className="text-primary font-semibold">
          {providers.length}
        </strong>{" "}
        {resolvePlural({
          count: providers.length,
          singular: "vira",
          dual: "virov",
          plural: "virov",
        })}
      </span>
      <span className="flex items-center gap-2">
        {isDeveloping && (
          <span
            className="relative flex size-2"
            title="Zgodba se razvija"
            aria-label="Zgodba se razvija"
          >
            <span className="bg-vidikgreen absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-vidikgreen relative inline-flex size-2 rounded-full" />
          </span>
        )}
        <span suppressHydrationWarning>
          posodobljeno {timeDiffInSlovenian(newestDate)}
        </span>
      </span>
    </div>
  );
}

function KeyPoints({
  bullets,
  articlesById,
  onSourceClick,
}: {
  bullets: StoryBullet[];
  articlesById: Map<number, StoryArticle>;
  onSourceClick: () => void;
}) {
  return (
    <section
      aria-labelledby="key-points"
      className="bg-surface-light text-surface-light-text rounded-lg border border-current/10 p-4 shadow-xs"
    >
      <h2 id="key-points" className="mb-4 font-bold tracking-wide uppercase">
        Na kratko
      </h2>

      <ul className="space-y-4">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-3">
            <span
              aria-hidden
              className="bg-electricblue mt-[0.55rem] size-1.5 shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-primary text-[0.95rem] leading-snug text-pretty">
                {bullet.text}
              </p>
              <BulletSources
                articles={bullet.articleIds.flatMap((id) => {
                  const article = articlesById.get(id);
                  return article ? [article] : [];
                })}
                onClick={onSourceClick}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-primary/50 mt-4 flex items-start gap-1.5 text-[11px] leading-snug">
        <Sparkles className="mt-px size-3 shrink-0" />
        Samodejni povzetek poročanja. Lahko se posodobi, ko pridejo novi članki.
      </p>
    </section>
  );
}

function BulletSources({
  articles,
  onClick,
}: {
  articles: StoryArticle[];
  onClick: () => void;
}) {
  if (articles.length === 0) return null;
  const shown = articles.slice(0, 4);
  const hidden = articles.length - shown.length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {shown.map((article) => (
        <Tooltip key={article.id}>
          <TooltipTrigger asChild>
            <a
              href={`#article-${article.id}`}
              onClick={onClick}
              className="border-primary/10 bg-primary/[0.04] hover:border-electricblue/50 hover:bg-electricblue/10 text-primary/70 flex items-center gap-1 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px] font-semibold transition-colors"
            >
              <ProviderImage
                provider={article.newsProvider}
                className="size-4 rounded-full object-contain"
              />
              {article.newsProvider.name}
            </a>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{article.title}</TooltipContent>
        </Tooltip>
      ))}
      {hidden > 0 && (
        <span className="text-primary/50 text-[11px] font-semibold">
          +{hidden}
        </span>
      )}
    </div>
  );
}

function CoverageTimeline({
  articles,
  side,
  onSideChange,
  mentionCounts,
  oldestDate,
  newestDate,
}: {
  articles: StoryArticle[];
  oldestDate: Date;
  newestDate: Date;
  side: SideFilter;
  onSideChange: (side: SideFilter) => void;
  mentionCounts: Map<number, number>;
}) {
  const counts = new Map<SideFilter, number>([["all", articles.length]]);
  for (const article of articles) {
    const key = biasSide(article.newsProvider.biasRating);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const visible =
    side === "all"
      ? articles
      : articles.filter((a) => biasSide(a.newsProvider.biasRating) === side);

  return (
    <section aria-labelledby="coverage" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 md:mb-6">
        <div>
          <h2
            id="coverage"
            className="text-primary text-xl font-bold tracking-tight md:text-2xl"
          >
            Kako so poročali mediji
          </h2>
          <p className="text-primary/60 mt-1 text-sm">
            {formatSpan(oldestDate, newestDate)} · najnovejši na vrhu
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filtriraj po pristranskosti"
          className="bg-primary/[0.06] grid w-full grid-cols-4 rounded-lg p-1 sm:flex sm:w-auto"
        >
          {biasSides.map(({ key, label, dot }) => {
            const count = counts.get(key) ?? 0;
            const active = side === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={count === 0}
                onClick={() => onSideChange(key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:px-3",
                  active
                    ? "bg-surface-light text-primary shadow-xs"
                    : "text-primary/60 hover:text-primary",
                )}
              >
                {dot && (
                  <span
                    className={cn("size-2 rounded-full", biasKeyToColor(dot))}
                  />
                )}
                {label}
                <span className="text-primary/40 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        {groupByDay(visible).map((group) => (
          <div key={`${group.dayKey}-${group.items[0].id}`}>
            <h3 className="text-primary/50 mb-3 text-xs font-bold tracking-wider uppercase">
              {dayFormatter.format(group.date)}
            </h3>
            <ol className="border-primary/10 space-y-3 sm:ml-1.5 sm:border-l sm:pl-5 md:pl-6">
              {group.items.map((article) => (
                <li key={article.id} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "ring-surface absolute top-6 -left-[25px] hidden size-2.5 rounded-full ring-4 sm:block md:-left-[29px]",
                      biasKeyToColor(article.newsProvider.biasRating ?? ""),
                    )}
                  />
                  <StoryArticleCard
                    article={article}
                    mentionCount={mentionCounts.get(article.id) ?? 0}
                  />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoryArticleCard({
  article,
  mentionCount,
}: {
  article: StoryArticle;
  mentionCount: number;
}) {
  const publishedAt = new Date(article.publishedAt);
  const image = article.imageUrls?.find(
    (url) => !url.toLowerCase().endsWith(".mp4"),
  );

  return (
    <a
      id={`article-${article.id}`}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group bg-surface-light border-primary/10 flex scroll-mt-24 gap-3 rounded-xl border p-3.5 shadow-xs transition-all duration-200 sm:gap-4 md:p-5 xl:scroll-mt-36",
        "hover:border-primary/25 hover:shadow-vidik",
        "target:ring-electricblue/60 target:ring-2",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <ProviderImage
            provider={article.newsProvider}
            className="border-primary/10 size-5 rounded-full border object-contain"
          />
          <span className="text-primary font-bold">
            {article.newsProvider.name}
          </span>
          <span
            className={cn(
              "rounded-sm px-1.5 py-px text-[10px] font-semibold uppercase",
              biasKeyToColor(article.newsProvider.biasRating ?? ""),
            )}
          >
            {biasKeyToLabel(article.newsProvider.biasRating ?? "")}
          </span>
          <time
            dateTime={article.publishedAt}
            className="text-primary/50 tabular-nums"
          >
            {timeFormatter.format(publishedAt)}
          </time>
          {article.isPaywalled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-primary/50">
                  <DollarSign className="size-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Članek je plačljiv</TooltipContent>
            </Tooltip>
          )}
          {mentionCount > 0 && (
            <span className="text-primary/60 flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {mentionCount}
            </span>
          )}
        </div>

        <h4 className="text-primary group-hover:text-electricblue line-clamp-2 text-base leading-snug font-semibold text-pretty transition-colors md:text-lg">
          {article.title}
          <ArrowUpRight className="ml-1 inline size-4 opacity-0 transition-opacity group-hover:opacity-60" />
        </h4>

        {article.summary && (
          <p className="text-primary/65 mt-1.5 line-clamp-2 text-sm leading-relaxed text-pretty">
            {article.summary}
          </p>
        )}

        {article.author && (
          <p className="text-primary/45 mt-2 truncate text-xs">
            {article.author}
          </p>
        )}
      </div>

      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="bg-primary/5 aspect-square w-16 shrink-0 self-start rounded-md object-cover sm:aspect-[4/3] sm:w-28 sm:rounded-lg md:w-36"
        />
      )}
    </a>
  );
}

const MENTIONS_PREVIEW = 4;

function SocialMentions({
  mentions,
  articlesById,
}: {
  mentions: StoryPageData["mentions"];
  articlesById: Map<number, StoryArticle>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="social-mentions" className="min-w-0">
      <div className="mb-3 flex items-baseline gap-2">
        <h2
          id="social-mentions"
          className="text-primary text-lg font-bold tracking-tight md:text-xl"
        >
          Na družbenih omrežjih
        </h2>
        <span className="text-primary/50 text-sm tabular-nums">
          {mentions.length}{" "}
          {resolvePlural({
            count: mentions.length,
            singular: "objava",
            dual: "objavi",
            plural: "objav",
          })}
        </span>
      </div>

      {/* Swipe row on phones; a two-column grid with a preview cap above. */}
      <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
        {mentions.map((mention, index) => {
          const article = articlesById.get(mention.articleIds[0]);
          return (
            <li
              key={mention.id}
              className={cn(
                "w-[80%] shrink-0 snap-start sm:w-auto",
                !expanded && index >= MENTIONS_PREVIEW && "sm:hidden",
              )}
            >
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-surface-light border-primary/10 hover:border-primary/25 hover:shadow-vidik flex h-full gap-3 rounded-xl border p-3.5 shadow-xs transition-all"
              >
                {mention.platform === "reddit" ? (
                  <Icon href={redditIcon} className="size-7 shrink-0" />
                ) : (
                  <MessageCircle className="size-7 shrink-0" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-primary group-hover:text-electricblue line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                    {mention.title ?? article?.title ?? mention.url}
                  </p>
                  <p
                    className="text-primary/50 mt-1 truncate text-xs"
                    suppressHydrationWarning
                  >
                    {[
                      mention.community && `r/${mention.community}`,
                      mention.postedAt &&
                        timeDiffInSlovenian(new Date(mention.postedAt)),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {article && (
                    <p className="text-primary/60 mt-auto flex items-center gap-1.5 pt-2 text-xs">
                      <ProviderImage
                        provider={article.newsProvider}
                        className="size-3.5 rounded-full object-contain"
                      />
                      <span className="truncate">
                        Deli članek: {article.newsProvider.name}
                      </span>
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      {mentions.length > MENTIONS_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-electricblue mt-3 hidden text-xs font-semibold hover:underline sm:block"
        >
          {expanded ? "Pokaži manj" : `Pokaži vse (${mentions.length})`}
        </button>
      )}
    </section>
  );
}

/** One-line bias summary for narrow screens, where the full chart is too tall. */
function BiasStrip({ articles }: { articles: StoryArticle[] }) {
  const { leftPercent, centerPercent, rightPercent, totalCount } =
    getBiasDistribution(articles);
  if (totalCount === 0) return null;
  const segments = [
    { label: "Leva", percent: leftPercent, color: biasKeyToColor("left") },
    {
      label: "Center",
      percent: centerPercent,
      color: biasKeyToColor("center"),
    },
    { label: "Desna", percent: rightPercent, color: biasKeyToColor("right") },
  ];

  return (
    <section
      aria-label="Distribucija pristranskosti"
      className="bg-surface-light text-surface-light-text rounded-lg border border-current/10 p-4 shadow-xs lg:hidden"
    >
      <div className="mb-2.5 flex items-center justify-between text-sm font-bold tracking-wide uppercase">
        Pristranskost virov
        <BiasInfoTooltip />
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {segments.map(
          (segment) =>
            segment.percent > 0 && (
              <div
                key={segment.label}
                className={cn(segment.color, "h-full border-0")}
                style={{ width: `${segment.percent}%` }}
              />
            ),
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold">
        {segments.map((segment) => (
          <span key={segment.label}>
            <span className="text-primary/60 font-medium">{segment.label}</span>{" "}
            {segment.percent}%
          </span>
        ))}
      </div>
    </section>
  );
}

function ShareButtons() {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 3000);
      })
      .catch((e) => {
        console.error("Failed to copy: ", e);
      });
  };

  const handleShare = () => {
    navigator
      .share({ title: document.title, url: window.location.href })
      .catch((e) => {
        console.error("Failed to share: ", e);
      });
  };

  const buttonClassName =
    "text-primary rounded-md border border-current/20 bg-current/10 p-2 transition-colors hover:bg-current/15 focus:ring-2 focus:ring-current/50 focus:ring-offset-1 focus:outline-none active:bg-current/20";

  return (
    <div className="ml-auto flex items-center gap-1.5 normal-case">
      <div className="relative flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger className={buttonClassName} onClick={handleCopy}>
            <Copy className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Kopiraj povezavo</TooltipContent>
        </Tooltip>
        <span
          className={cn(
            "pointer-events-none absolute top-full mt-1.5 text-xs tracking-normal transition-opacity duration-200",
            hasCopied ? "opacity-100" : "opacity-0",
          )}
        >
          Kopirano!
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger onClick={handleShare} className={buttonClassName}>
          <Share className="size-3" />
        </TooltipTrigger>
        <TooltipContent>Deli</TooltipContent>
      </Tooltip>
    </div>
  );
}

const MAX_CAROUSEL_ITEMS = 8;

function HeroImageCarousel({
  articles,
  onCaptionClick,
  title,
}: {
  articles: StoryArticle[];
  onCaptionClick: () => void;
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselItems = getCarouselArticleIds(articles)
    .slice(0, MAX_CAROUSEL_ITEMS)
    .flatMap((id) => {
      const article = articles.find((a) => a.id === id);
      if (!article) return [];
      return [
        {
          id: article.id,
          title: article.title,
          provider: article.newsProvider,
          imageUrl: article.imageUrls?.[0] || fallbackArticleImage,
        },
      ];
    });

  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  if (carouselItems.length === 0) {
    return (
      <figure className="bg-muted border-primary/10 relative aspect-video overflow-hidden rounded-xl border">
        <img
          src={fallbackArticleImage}
          alt={title}
          className="h-full w-full object-cover"
        />
      </figure>
    );
  }

  const current = carouselItems[currentIndex % carouselItems.length];

  return (
    <figure className="bg-muted border-primary/10 relative aspect-video overflow-hidden rounded-xl border">
      {carouselItems.map((item, index) => (
        <img
          key={item.id}
          src={item.imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1800 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        />
      ))}
      {carouselItems.length > 1 && (
        // On narrow screens the dots sit top right so the caption keeps the
        // full width.
        <CarouselDots
          count={carouselItems.length}
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
          className="absolute top-3 right-3 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm sm:hidden"
        />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-16 md:p-4 md:pt-20">
        <a
          key={current.id}
          href={`#article-${current.id}`}
          onClick={onCaptionClick}
          className="animate-in fade-in slide-in-from-bottom-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-white duration-700"
        >
          <ProviderImage
            className="size-6 shrink-0 rounded-full border-2 border-white/80 bg-white object-contain"
            provider={current.provider}
          />
          <span className="line-clamp-2 sm:line-clamp-1">{current.title}</span>
        </a>
        {carouselItems.length > 1 && (
          <CarouselDots
            count={carouselItems.length}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            className="mb-2.5 hidden sm:flex"
          />
        )}
      </figcaption>
    </figure>
  );
}

function CarouselDots({
  count,
  currentIndex,
  onSelect,
  className,
}: {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 gap-1", className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Slika ${index + 1}`}
          onClick={() => onSelect(index)}
          className={cn(
            "h-1.5 rounded-full bg-white transition-all",
            index === currentIndex ? "w-4" : "w-1.5 opacity-50",
          )}
        />
      ))}
    </div>
  );
}
