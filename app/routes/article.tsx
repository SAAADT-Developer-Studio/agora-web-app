import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import {
  breadcrumbJsonLd,
  CATEGORY_SEO,
  getSeoMetas,
  newsArticleJsonLd,
  SITE_URL,
} from "~/lib/seo";
import { isCategoryKey } from "~/config";
import fallbackArticleImage from "~/assets/fallback.png";
import {
  Info,
  Newspaper,
  Calendar,
  SatelliteDish,
  Copy,
  Share,
} from "lucide-react";
import { resolvePlural } from "~/utils/resolvePlural";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { BiasDistribution } from "~/components/bias-distribution";
import { isSameHour } from "~/utils/isSameHour";
import { Link } from "react-router";
import { InfoCard } from "~/components/ui/info-card";
import { ArticleItem } from "~/components/article-item";
import { Tooltip, TooltipContent } from "~/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { getCarouselArticleIds } from "~/utils/getCarouselArticleIds";
import { ProviderImage } from "~/components/provider-image";
import { ArchiveNotice, NewerCopyNotice } from "~/components/archive-notice";
import { getAppContext } from "~/lib/appContext";
import {
  clanekHttpStatus,
  clanekIndexing,
  clanekPath,
  clusterOwnCategory,
  findClusterForClanek,
  resolveClanekArchive,
} from "~/lib/articleClusterLookup";
import { extractHeroImage } from "~/utils/extractHeroImage";

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "max-age=10, s-maxage=10",
  };
}

export type ArticlePageData = {
  cluster: {
    id: number;
    title: string;
    articles: {
      id: number;
      title: string;
      url: string;
      publishedAt: string;
      summary: string | null;
      newsProviderKey: string;
      author: string | null;
      imageUrls: string[] | null;
      isPaywalled: boolean | null;
      newsProvider: {
        key: string;
        name: string;
        biasRating: string | null;
        rank: number;
      };
    }[];
  };
  uniqueCategories: string[];
  heroImageUrl: string;
  archived: boolean;
  newerClusterPath: string | null;
  canonicalPath: string | null;
  canonicalCategory: string | null;
};

export async function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;
  const { db, measurer } = getAppContext(context);

  // One pg Client cannot run two queries at once. Resolve the cluster first
  // so a missing row never starts the selection lookup.
  const cluster = await measurer.time("fetchClusterData", () =>
    findClusterForClanek(db, articleId),
  );

  if (!cluster) {
    throw new Response("Article Not Found", {
      status: clanekHttpStatus(false),
    });
  }

  const articles = cluster.articleClusters.map((ac) => ac.article);

  articles.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  const allCategories = articles.flatMap((a) => a.categories || []);
  const uniqueCategories = Array.from(new Set(allCategories));
  const heroImageUrl = extractHeroImage(articles);
  const canonicalCategory = clusterOwnCategory(articles);
  const timeRange = articleTimeRange(articles.map((item) => item.publishedAt));
  const archive = await measurer.time("resolveClanekArchive", () =>
    resolveClanekArchive(
      db,
      {
        id: cluster.id,
        runId: cluster.runId,
        createdAt: cluster.createdAt,
        articleIds: articles.map((item) => item.id),
        newestPublishedAt: timeRange?.newest ?? null,
        category: canonicalCategory,
      },
      new Date(),
    ),
  );

  return {
    cluster: {
      id: cluster.id,
      title: cluster.title,
      articles,
    },
    uniqueCategories,
    heroImageUrl,
    archived: archive.archived,
    newerClusterPath: archive.newerClusterPath,
    canonicalCategory,
    canonicalPath: clanekPath(canonicalCategory, articleId),
  } satisfies ArticlePageData;
}

function articleTimeRange(publishedAt: string[]) {
  const times = publishedAt
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));
  if (times.length === 0) return null;
  const oldestMs = Math.min(...times);
  const newestMs = Math.max(...times);
  return {
    oldest: new Date(oldestMs),
    newest: new Date(newestMs),
    publishedTime: new Date(oldestMs).toISOString(),
    modifiedTime: new Date(newestMs).toISOString(),
  };
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { cluster, uniqueCategories, archived, newerClusterPath } = loaderData;
  const timeRange = articleTimeRange(
    cluster.articles.map((article) => article.publishedAt),
  );

  const uniqueProviders = Array.from(
    new Set(cluster.articles.map((a) => a.newsProviderKey)),
  );

  const biasDistribution = getBiasDistribution(cluster.articles);
  const providersMap = new Map(
    cluster.articles.map((a) => [a.newsProviderKey, a.newsProvider]),
  );

  const providers = Array.from(providersMap.values()).map((p) => ({
    ...p,
    articleCount: cluster.articles.filter((a) => a.newsProviderKey === p.key)
      .length,
  }));

  return (
    <article className="mx-auto max-w-5xl px-1 py-1 md:py-6">
      <div className="mb-6 flex items-center gap-3 text-sm">
        <Link to="/" className="tracking-wider">
          VIDIK
        </Link>
        <div className="flex max-h-5 flex-wrap gap-3 overflow-clip">
          {uniqueCategories.slice(0, 4).map((category) => (
            <span className="flex gap-3" key={category}>
              <span>•</span>
              <span className="capitalize">{category}</span>
            </span>
          ))}
        </div>

        <ShareButtons />
      </div>

      {archived ? (
        <ArchiveNotice newerTo={newerClusterPath} />
      ) : newerClusterPath ? (
        <NewerCopyNotice newerTo={newerClusterPath} />
      ) : null}

      <h1 className="text-primary mb-8 line-clamp-3 text-xl leading-normal font-bold tracking-tight text-balance md:text-3xl md:leading-tight lg:text-4xl">
        {cluster.title}
      </h1>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <HeroImageCarousel
          articles={cluster.articles}
          title={cluster.title}
          clusterId={cluster.id}
          className="md:col-span-2"
        />
        <BiasDistribution
          biasDistribution={biasDistribution}
          providers={providers}
        />
      </div>

      <ArticleInfoBanner
        providerCount={uniqueProviders.length}
        articleCount={cluster.articles.length}
        oldestDate={timeRange?.oldest ?? null}
        newestDate={timeRange?.newest ?? null}
      />

      <div className="mb-8">
        <h2 className="text-primary mb-6 text-xl font-bold md:text-3xl">
          Pokritje iz {cluster.articles.length}{" "}
          {resolvePlural({
            count: cluster.articles.length,
            singular: "članek",
            dual: "članka",
            plural: "člankov",
          })}
        </h2>

        <div className="space-y-3 md:space-y-5">
          {cluster.articles.map((article) => (
            <ArticleItem key={article.id} article={article} />
          ))}
        </div>
      </div>
      <ArticleBottomBanner
        articleCount={cluster.articles.length}
        providerCount={uniqueProviders.length}
        newestDate={timeRange?.newest ?? null}
      />
    </article>
  );
}

function ArticleInfoBanner({
  providerCount,
  articleCount,
  oldestDate,
  newestDate,
}: {
  providerCount: number;
  articleCount: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}) {
  return (
    <InfoCard className="mb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Info className="text-accent mt-1 h-5 w-5 flex-shrink-0" />
          <div>
            <h2 className="mb-2 font-bold">VEČ POGLEDOV, EN DOGODEK</h2>
            <p className="text-surface-text/70 text-sm leading-relaxed text-pretty">
              Ta razdelek združuje več člankov iz različnih virov, ki pokrivajo
              isto zgodbo. To vam omogoča celovit pogled na to, kako različni
              mediji poročajo o istem dogodku.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 md:flex-shrink-0">
          <div className="flex items-center gap-3">
            <Newspaper className="h-6 w-6" />
            <div>
              <div className="text-2xl font-bold">{articleCount}</div>
              <div className="text-xs">
                {resolvePlural({
                  count: articleCount,
                  singular: "Članek",
                  dual: "Članka",
                  plural: "Člankov",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SatelliteDish className="h-6 w-6" />
            <div>
              <div className="text-2xl font-bold">{providerCount}</div>
              <div className="text-xs">
                {resolvePlural({
                  count: providerCount,
                  singular: "Vir",
                  dual: "Vira",
                  plural: "Virov",
                })}
              </div>
            </div>
          </div>
          {oldestDate && newestDate ? (
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <Timespan oldestDate={oldestDate} newestDate={newestDate} />
            </div>
          ) : null}
          <div className="flex items-center gap-3"></div>
        </div>
      </div>
    </InfoCard>
  );
}

function Timespan({
  oldestDate,
  newestDate,
}: {
  oldestDate: Date;
  newestDate: Date;
}) {
  return (
    <div className="flex flex-col items-start space-y-0.5">
      <div className="text-sm font-semibold">
        {oldestDate.toDateString() === newestDate.toDateString() ? (
          <div>
            <div className="font-bold">
              {oldestDate.toLocaleDateString("sl-SI", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <span className="text-xs">
              {oldestDate.toLocaleTimeString("sl-SI", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {!isSameHour(oldestDate, newestDate) && " - "}
              {!isSameHour(oldestDate, newestDate) &&
                newestDate.toLocaleTimeString("sl-SI", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </span>
          </div>
        ) : (
          <>
            {oldestDate.toLocaleDateString("sl-SI", {
              day: "numeric",
              month: "short",
            })}{" "}
            –{" "}
            {newestDate.toLocaleDateString("sl-SI", {
              day: "numeric",
              month: "short",
            })}
          </>
        )}
      </div>
      <div className="text-xs">Obdobje</div>
    </div>
  );
}

function ArticleBottomBanner({
  articleCount,
  providerCount,
  newestDate,
}: {
  articleCount: number;
  providerCount: number;
  newestDate: Date | null;
}) {
  return (
    <InfoCard className="mt-12 text-center">
      <p className="text-sm leading-relaxed">
        Ta sklop je bil avtomatsko generiran z analizo{" "}
        <strong className="font-semibold">
          {articleCount}{" "}
          {resolvePlural({
            count: articleCount,
            singular: "članka",
            dual: "člankov",
            plural: "člankov",
          })}
        </strong>{" "}
        iz{" "}
        <strong className="font-semibold">
          {providerCount}{" "}
          {resolvePlural({
            count: providerCount,
            singular: "vira",
            dual: "različnih virov",
            plural: "različnih virov",
          })}
        </strong>
        .
        {newestDate ? (
          <>
            {" "}
            Nazadnje posodobljeno{" "}
            {newestDate.toLocaleDateString("sl-SI", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </>
        ) : null}
      </p>
    </InfoCard>
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
      .share({
        title: document.title,
        url: window.location.href,
      })
      .then(() => {
        console.log("Shared!");
      })
      .catch((e) => {
        console.error("Failed to share: ", e);
      });
  };

  return (
    <div className="ml-auto flex items-center gap-1.5">
      <div className="relative flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger
            className="rounded-md border border-current/20 bg-current/10 p-2 transition-colors hover:bg-current/15 focus:ring-2 focus:ring-current/50 focus:ring-offset-1 focus:outline-none active:bg-current/20"
            onClick={handleCopy}
          >
            <Copy className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Kopiraj povezavo</TooltipContent>
        </Tooltip>
        <span
          className={cn(
            "pointer-events-none absolute top-full mt-1.5 text-xs transition-opacity duration-200",
            hasCopied ? "opacity-100" : "opacity-0",
          )}
        >
          Kopirano!
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger
          onClick={handleShare}
          className="rounded-md border border-current/20 bg-current/10 p-2 transition-colors hover:bg-current/15 focus:ring-2 focus:ring-current/50 focus:ring-offset-1 focus:outline-none active:bg-current/20"
        >
          <Share className="size-3" />
        </TooltipTrigger>
        <TooltipContent>Deli</TooltipContent>
      </Tooltip>
    </div>
  );
}

function HeroImageCarousel({
  articles,
  title,
  clusterId,
  className,
}: {
  articles: ArticlePageData["cluster"]["articles"];
  title: string;
  clusterId: number;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselArticleIds = getCarouselArticleIds(articles);

  const carouselItems = carouselArticleIds
    .map((id) => {
      const article = articles.find((a) => a.id === id);
      if (!article) return null;
      return {
        id: article.id,
        title: article.title,
        newsProviderKey: article.newsProvider.key,
        newsProviderName: article.newsProvider.name,
        imageUrl: article.imageUrls?.[0] || fallbackArticleImage,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  useEffect(() => {
    if (carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  return (
    <figure className={className}>
      <div
        className="bg-muted border-primary/20 relative overflow-hidden rounded-lg border"
        style={{ aspectRatio: "16/9" }}
      >
        {carouselItems.map((item, index) => (
          <img
            key={item.id}
            src={item.imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-opacity duration-1800 ease-in-out"
            style={{
              viewTransitionName:
                index === currentIndex
                  ? `article-image-${clusterId}`
                  : undefined,
              opacity: index === currentIndex ? 1 : 0,
              position: index === currentIndex ? "relative" : "absolute",
              top: 0,
              left: 0,
            }}
          />
        ))}
        {carouselItems.length > 1 && (
          <div className="absolute inset-0 flex items-end [background-image:linear-gradient(to_top,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.55)_15%,rgba(0,0,0,0)_50%)]">
            <div
              className="relative w-full overflow-hidden"
              style={{ minHeight: "3.5rem" }}
            >
              {carouselItems.map((item, index) => (
                <a
                  href={`#article-${item.id}`}
                  key={item.id}
                  // TODO: use container query to show/hide caption
                  className="absolute inset-x-0 bottom-0 hidden items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-700 ease-in-out sm:flex"
                  style={{
                    opacity: index === currentIndex ? 1 : 0,
                    transform:
                      index === currentIndex
                        ? "translateY(0)"
                        : "translateY(0.5rem)",
                    padding: "1rem",
                    pointerEvents: index === currentIndex ? "auto" : "none",
                  }}
                >
                  <ProviderImage
                    className="size-6 rounded-full border-2 border-current"
                    provider={{
                      key: item.newsProviderKey,
                      name: item.newsProviderName,
                    }}
                  />
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

export function meta({
  loaderData,
  location,
  params,
}: Route.MetaArgs): Route.MetaDescriptors {
  if (!loaderData?.cluster) {
    return getSeoMetas({
      title: "Članek ni najden | Vidik",
      description: "Oprostite, iskani članek ni bil najden.",
      pathname: location.pathname,
      noindex: clanekIndexing(false).noindex,
      includeSiteSchema: false,
    });
  }

  const {
    cluster,
    uniqueCategories,
    heroImageUrl,
    canonicalPath,
    canonicalCategory,
  } = loaderData;
  const title = cluster.title;
  const category =
    canonicalCategory && isCategoryKey(canonicalCategory)
      ? canonicalCategory
      : params.category;
  const categoryLabel = isCategoryKey(category)
    ? CATEGORY_SEO[category].title.replace(" | Vidik", "")
    : category;
  const pathname = canonicalPath ?? location.pathname;

  const providers = Array.from(
    new Map(
      cluster.articles.map((a) => [a.newsProviderKey, a.newsProvider.name]),
    ).values(),
  );

  const timeRange = articleTimeRange(
    cluster.articles.map((article) => article.publishedAt),
  );

  const description = `Primerjava poročanja ${providers.length} slovenskih medijev o temi »${title}«. Viri: ${providers.slice(0, 5).join(", ")}${providers.length > 5 ? " in drugi" : ""}.`;

  const keywords = [
    ...uniqueCategories,
    ...providers.slice(0, 5),
    "vidik",
    "medijska pristranskost",
  ].join(", ");

  const pageUrl = new URL(pathname, SITE_URL).href;

  return getSeoMetas({
    title: `${title} | Vidik`,
    description,
    image: heroImageUrl || undefined,
    pathname,
    keywords,
    ogType: "article",
    publishedTime: timeRange?.publishedTime,
    modifiedTime: timeRange?.modifiedTime,
    section: categoryLabel,
    authors: providers,
    noindex: clanekIndexing(true).noindex,
    jsonLd: [
      ...(timeRange
        ? [
            newsArticleJsonLd({
              headline: title,
              description,
              image: heroImageUrl || undefined,
              url: pageUrl,
              datePublished: timeRange.publishedTime,
              dateModified: timeRange.modifiedTime,
              keywords: uniqueCategories,
              section: categoryLabel,
              sources: cluster.articles.map((a) => ({
                title: a.title,
                url: a.url,
                publishedAt: new Date(a.publishedAt).toISOString(),
                providerName: a.newsProvider.name,
              })),
            }),
          ]
        : []),
      breadcrumbJsonLd([
        { name: "Domov", path: "/" },
        { name: categoryLabel, path: `/${category}` },
        { name: title, path: pathname },
      ]),
    ],
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
