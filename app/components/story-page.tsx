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

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <header className="mb-6 md:mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold tracking-wider uppercase">
              {story.isDeveloping ? (
                <span className="bg-vidikgreen/15 text-vidikgreen flex items-center gap-2 rounded-full px-2.5 py-1">
                  <span className="relative flex size-2">
                    <span className="bg-vidikgreen absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                    <span className="bg-vidikgreen relative inline-flex size-2 rounded-full" />
                  </span>
                  V razvoju
                </span>
              ) : (
                <span className="bg-primary/8 rounded-full px-2.5 py-1">
                  Zgodba
                </span>
              )}
              <span className="text-primary/60" suppressHydrationWarning>
                Posodobljeno {timeDiffInSlovenian(newestDate)}
              </span>
            </div>

            <h1 className="text-primary text-2xl leading-tight font-bold tracking-tight text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {story.title}
            </h1>

            <CoverageMeta
              providers={providers}
              articleCount={articles.length}
              oldestDate={oldestDate}
              newestDate={newestDate}
            />
          </header>

          <HeroImageCarousel
            articles={articles}
            onCaptionClick={showAll}
            title={story.title}
            storyId={story.id}
          />

          {story.bullets.length > 0 && (
            <KeyPoints
              bullets={story.bullets}
              articlesById={articlesById}
              onSourceClick={showAll}
            />
          )}
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-6 lg:sticky lg:top-20 xl:top-32">
            <BiasDistribution
              biasDistribution={getBiasDistribution(articles)}
              providers={providers}
            />
            {mentions.length > 0 && (
              <SocialMentions mentions={mentions} articlesById={articlesById} />
            )}
          </div>
        </aside>

        <CoverageTimeline
          articles={articles}
          side={side}
          onSideChange={setSide}
          mentionCounts={mentionCounts}
        />
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
  oldestDate,
  newestDate,
}: {
  providers: ReturnType<typeof uniqueProviders>;
  articleCount: number;
  oldestDate: Date;
  newestDate: Date;
}) {
  const shown = providers.slice(0, 5);
  const hidden = providers.length - shown.length;
  const sameDay =
    shortDateFormatter.format(oldestDate) ===
    shortDateFormatter.format(newestDate);

  return (
    <div className="text-primary/70 mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
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
      <span aria-hidden className="text-primary/30">
        •
      </span>
      <span>
        {sameDay
          ? `${shortDateFormatter.format(oldestDate)}, ${timeFormatter.format(oldestDate)}–${timeFormatter.format(newestDate)}`
          : `${shortDateFormatter.format(oldestDate)} – ${shortDateFormatter.format(newestDate)}`}
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
      className="border-primary/10 bg-surface-light mt-8 rounded-xl border p-5 shadow-xs md:p-8"
    >
      <h2
        id="key-points"
        className="mb-5 text-xs font-bold tracking-[0.2em] uppercase md:mb-6"
      >
        Na kratko
      </h2>

      <ol className="space-y-5 md:space-y-6">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-4 md:gap-5">
            <span
              aria-hidden
              className="text-electricblue w-6 shrink-0 pt-0.5 text-lg leading-none font-bold tabular-nums md:text-xl"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-primary text-base leading-relaxed text-pretty md:text-lg">
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
      </ol>

      <p className="text-primary/50 border-primary/10 mt-6 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed md:mt-8">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" />
        Povzetek je samodejno ustvarjen iz poročanja medijev in se lahko
        posodobi, ko pridejo novi članki. Za podrobnosti preberite vire.
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
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {shown.map((article) => (
        <Tooltip key={article.id}>
          <TooltipTrigger asChild>
            <a
              href={`#article-${article.id}`}
              onClick={onClick}
              className="border-primary/10 bg-primary/[0.04] hover:border-electricblue/50 hover:bg-electricblue/10 text-primary/70 flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-[11px] font-semibold transition-colors"
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
}: {
  articles: StoryArticle[];
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="coverage"
            className="text-primary text-xl font-bold tracking-tight md:text-2xl"
          >
            Kako so poročali mediji
          </h2>
          <p className="text-primary/60 mt-1 text-sm">
            Najnovejši članki na vrhu
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filtriraj po pristranskosti"
          className="bg-primary/[0.06] flex rounded-lg p-1"
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
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:px-3",
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
            <ol className="border-primary/10 ml-1.5 space-y-3 border-l pl-5 md:pl-6">
              {group.items.map((article) => (
                <li key={article.id} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "ring-surface absolute top-6 -left-[25px] size-2.5 rounded-full ring-4 md:-left-[29px]",
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
        "group bg-surface-light border-primary/10 flex scroll-mt-24 gap-4 rounded-xl border p-4 shadow-xs transition-all duration-200 md:p-5 xl:scroll-mt-36",
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
          className="bg-primary/5 hidden aspect-[4/3] w-28 shrink-0 self-start rounded-lg object-cover sm:block md:w-36"
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
  const shown = expanded ? mentions : mentions.slice(0, MENTIONS_PREVIEW);

  return (
    <section
      aria-labelledby="social-mentions"
      className="bg-surface-light text-surface-light-text rounded-lg border border-current/10 p-4 shadow-xs"
    >
      <h2
        id="social-mentions"
        className="mb-1 flex items-center justify-between font-bold tracking-wide uppercase"
      >
        Na družbenih omrežjih
        <span className="bg-primary/8 text-primary/70 rounded-full px-2 py-0.5 text-xs tabular-nums">
          {mentions.length}
        </span>
      </h2>
      <p className="text-primary/60 mb-4 text-xs">
        Objave, ki delijo članke iz te zgodbe
      </p>

      <ul className="space-y-1">
        {shown.map((mention) => {
          const article = articlesById.get(mention.articleIds[0]);
          return (
            <li key={mention.id}>
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary/[0.05] -mx-2 flex gap-3 rounded-lg p-2 transition-colors"
              >
                {mention.platform === "reddit" ? (
                  <Icon href={redditIcon} className="mt-0.5 size-6 shrink-0" />
                ) : (
                  <MessageCircle className="mt-0.5 size-6 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-primary line-clamp-2 text-sm leading-snug font-semibold">
                    {mention.title ?? article?.title ?? mention.url}
                  </p>
                  <p
                    className="text-primary/50 mt-1 truncate text-xs"
                    suppressHydrationWarning
                  >
                    {[
                      mention.community && `r/${mention.community}`,
                      mention.author && `u/${mention.author}`,
                      mention.postedAt &&
                        timeDiffInSlovenian(new Date(mention.postedAt)),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {article && (
                    <p className="text-primary/50 mt-1 flex items-center gap-1.5 text-xs">
                      <ProviderImage
                        provider={article.newsProvider}
                        className="size-3.5 rounded-full object-contain"
                      />
                      <span className="truncate">
                        {article.newsProvider.name}
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
          className="text-electricblue mt-2 text-xs font-semibold hover:underline"
        >
          {expanded ? "Pokaži manj" : `Pokaži vse (${mentions.length})`}
        </button>
      )}
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
  storyId,
}: {
  articles: StoryArticle[];
  onCaptionClick: () => void;
  title: string;
  storyId: number;
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
          style={{ viewTransitionName: `article-image-${storyId}` }}
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
          style={{
            viewTransitionName:
              index === currentIndex ? `article-image-${storyId}` : undefined,
            opacity: index === currentIndex ? 1 : 0,
          }}
        />
      ))}
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
          <span className="line-clamp-1">{current.title}</span>
        </a>
        {carouselItems.length > 1 && (
          <div className="flex shrink-0 gap-1">
            {carouselItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Slika ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full bg-white transition-all",
                  index === currentIndex ? "w-4" : "w-1.5 opacity-50",
                )}
              />
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
