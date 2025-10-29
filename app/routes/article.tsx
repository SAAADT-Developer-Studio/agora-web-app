import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import fallbackArticleImage from "~/assets/fallback.png";
import { cluster as clusterSchema } from "~/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  Info,
  Newspaper,
  Calendar,
  SatelliteDish,
  Clock,
  NotebookPen,
} from "lucide-react";
import { resolvePlural } from "~/utils/resolvePlural";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { BiasDistribution } from "~/components/bias-distribution";
import { isSameHour } from "~/utils/isSameHour";
import { extractHeroImage } from "~/utils/extractHeroImage";
import { ProviderImage } from "~/components/provider-image";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { InfoCard } from "~/components/ui/info-card";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "max-age=10, s-maxage=10",
  };
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;
  const db = context.db;

  let condition = eq(clusterSchema.slug, articleId);
  if (Number.isInteger(Number.parseInt(articleId))) {
    condition = eq(clusterSchema.id, Number.parseInt(articleId));
  }

  const cluster = await db.query.cluster.findFirst({
    where: condition,
    with: {
      articles: {
        columns: {
          id: true,
          title: true,
          url: true,
          publishedAt: true,
          summary: true,
          categories: true,
          newsProviderKey: true,
          imageUrls: true,
          author: true,
        },
        with: { newsProvider: true },
      },
    },
  });

  if (!cluster) {
    throw new Response("Article Not Found", { status: 404 });
  }

  const heroImageUrl = extractHeroImage(
    cluster.articles.map((a) => {
      return {
        url: a.imageUrls ? a.imageUrls[0] : fallbackArticleImage,
        providerKey: a.newsProviderKey,
        providerRank: a.newsProvider.rank,
      };
    }),
  );

  cluster.articles.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  const allCategories = cluster.articles.flatMap((a) => a.categories || []);
  const uniqueCategories = Array.from(new Set(allCategories));

  return {
    cluster,
    uniqueCategories,
    heroImageUrl,
  };
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { cluster, uniqueCategories, heroImageUrl } = loaderData;
  const dates = cluster.articles.map((a) => new Date(a.publishedAt));
  const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

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
    <div className="bg-background min-h-screen">
      <article className="mx-auto max-w-5xl px-1 py-1 md:py-6">
        <div className="text-muted-foreground mb-6 flex max-h-5 flex-wrap items-center gap-3 overflow-clip text-sm">
          <Link to="/" className="tracking-wider">
            VIDIK
          </Link>
          {uniqueCategories.slice(0, 4).map((category) => (
            <span className="flex gap-3">
              <span>•</span>
              <span className="capitalize">{category}</span>
            </span>
          ))}
        </div>

        <h1 className="text-primary mb-8 text-xl leading-normal font-bold tracking-tight text-balance md:text-3xl md:leading-tight lg:text-4xl">
          {cluster.title}
        </h1>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <figure className="md:col-span-2">
            <div className="bg-muted border-primary/20 overflow-hidden rounded-lg border">
              <img
                src={heroImageUrl}
                alt={cluster.title}
                className="h-auto w-full object-cover"
                style={{
                  aspectRatio: "16/9",
                  viewTransitionName: `article-image-${cluster.id}`,
                }}
              />
            </div>
          </figure>
          <BiasDistribution
            biasDistribution={biasDistribution}
            providers={providers}
          />
        </div>

        <ArticleInfoBanner
          providerCount={uniqueProviders.length}
          articleCount={cluster.articles.length}
          oldestDate={oldestDate}
          newestDate={newestDate}
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
            {cluster.articles.map((article, index) => {
              const publishDate = new Date(article.publishedAt);
              return (
                <>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={`${article.id}-desktop`}
                    className="group bg-primary/5 border-primary/10 hover:bg-primary/9 relative hidden rounded-lg border p-4 transition-colors duration-200 md:block"
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
                          <div
                            className={`flex h-[25.33px] items-center justify-center rounded-sm px-3 py-1 text-xs font-medium whitespace-nowrap uppercase ${biasKeyToColor(article.newsProvider.biasRating ?? "", true)}`}
                          >
                            {biasKeyToLabel(
                              article.newsProvider.biasRating ?? "",
                            )}
                          </div>
                        </div>

                        <h3 className="text-primary group-hover:text-accent text-md mb-2 line-clamp-1 leading-snug font-semibold text-pretty transition-colors md:text-lg">
                          {article.title}
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
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={`${article.id}-mobile`}
                    className="bg-primary/5 border-primary/10 relative block rounded-lg border p-2 md:hidden"
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
                        <div
                          className={`flex items-center justify-center rounded-sm px-1 py-1 text-[8px] font-medium whitespace-nowrap uppercase ${biasKeyToColor(article.newsProvider.biasRating ?? "", true)}`}
                        >
                          {biasKeyToLabel(
                            article.newsProvider.biasRating ?? "",
                          )}
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
                </>
              );
            })}
          </div>
        </div>
        <ArticleBottomBanner
          articleCount={cluster.articles.length}
          providerCount={uniqueProviders.length}
          newestDate={newestDate}
        />
      </article>
    </div>
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
  oldestDate: Date;
  newestDate: Date;
}) {
  return (
    <InfoCard className="mb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Info className="text-accent mt-1 h-5 w-5 flex-shrink-0" />
          <div>
            <h2 className="text-card-foreground mb-2 font-bold">
              VEČ POGLEDOV, EN DOGODEK
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Ta razdelek združuje več člankov iz različnih virov, ki pokrivajo
              isto zgodbo. To vam omogoča celovit pogled na to, kako različni
              mediji poročajo o istem dogodku.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 md:flex-shrink-0">
          <div className="flex items-center gap-3">
            <Newspaper className="text-muted-foreground h-6 w-6" />
            <div>
              <div className="text-primary text-2xl font-bold">
                {articleCount}
              </div>
              <div className="text-muted-foreground text-xs">
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
            <SatelliteDish className="text-muted-foreground h-6 w-6" />
            <div>
              <div className="text-primary text-2xl font-bold">
                {providerCount}
              </div>
              <div className="text-muted-foreground text-xs">
                {resolvePlural({
                  count: providerCount,
                  singular: "Vir",
                  dual: "Vira",
                  plural: "Virov",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground h-6 w-6" />
            <Timespan oldestDate={oldestDate} newestDate={newestDate} />
          </div>
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
      <div className="text-primary text-sm font-semibold">
        {oldestDate.toDateString() === newestDate.toDateString() ? (
          <div>
            <div className="font-bold">
              {oldestDate.toLocaleDateString("sl-SI", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <span className="text-muted-foreground text-xs">
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
      <div className="text-muted-foreground text-xs">Obdobje</div>
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
  newestDate: Date;
}) {
  return (
    <InfoCard className="mt-12 text-center">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Ta sklop je bil avtomatsko generiran z analizo{" "}
        <strong className="text-primary font-semibold">
          {articleCount}{" "}
          {resolvePlural({
            count: articleCount,
            singular: "članka",
            dual: "člankov",
            plural: "člankov",
          })}
        </strong>{" "}
        iz{" "}
        <strong className="text-primary font-semibold">
          {providerCount}{" "}
          {resolvePlural({
            count: providerCount,
            singular: "vira",
            dual: "različnih virov",
            plural: "različnih virov",
          })}
        </strong>
        . Nazadnje posodobljeno{" "}
        {newestDate.toLocaleDateString("sl-SI", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        .
      </p>
    </InfoCard>
  );
}

export function meta({
  data,
  location,
}: Route.MetaArgs): Route.MetaDescriptors {
  const title = data?.cluster ? data.cluster.title : "404 | Vidik";
  const imageUrl = data?.heroImageUrl || fallbackArticleImage;
  const keywords = data?.uniqueCategories
    ? data.uniqueCategories.join(", ")
    : "";

  const description = data?.cluster
    ? `${title}: ${data.cluster.articles
        .slice(0, 3)
        .map((a) => a.newsProvider.name + " - " + a.title)
        .join("; ")} in več`
    : "Oprostite, članek ni bil najden.";

  return getSeoMetas({
    title,
    description,
    image: imageUrl,
    pathname: location.pathname,
    keywords,
    ogType: "article",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
