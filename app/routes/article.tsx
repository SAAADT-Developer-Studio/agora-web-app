import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import fallbackArticleImage from "~/assets/fallback.png";
import { getDb } from "~/lib/db";
import { cluster as clusterSchema } from "~/drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "~/config";
import { Info, Newspaper, Calendar, SatelliteDish } from "lucide-react";
import { resolvePlural } from "~/lib/utils";

import fallbackImage from "~/assets/fallback.png";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { BiasDistribution } from "~/components/bias-distribution";

export async function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;
  const db = await getDb();

  const cluster = await db.query.cluster.findFirst({
    where: eq(clusterSchema.id, Number.parseInt(articleId)),
    with: {
      articles: { with: { newsProvider: true } },
    },
  });

  if (!cluster) {
    throw new Response("Article Not Found", { status: 404 });
  }

  cluster.articles.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return {
    cluster,
  };
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { cluster } = loaderData;
  console.log("Loaded cluster:", cluster);

  const dates = cluster.articles.map((a) => new Date(a.publishedAt));
  const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const allCategories = cluster.articles.flatMap((a) => a.categories || []);
  const uniqueCategories = Array.from(new Set(allCategories));

  const uniqueProviders = Array.from(
    new Set(cluster.articles.map((a) => a.newsProviderKey)),
  );

  const heroImage =
    cluster.articles.find((a) => a.imageUrls && a.imageUrls.length > 0)
      ?.imageUrls?.[0] ?? fallbackArticleImage;

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
      <article className="mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-6">
        <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono tracking-wider">VIDIK</span>
          {uniqueCategories.map((category) => (
            <>
              <span>•</span>
              <span className="capitalize">{category}</span>
            </>
          ))}
        </div>

        <h1 className="text-primary mb-8 text-3xl leading-tight font-bold tracking-tight text-balance lg:text-4xl">
          {cluster.title}
        </h1>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <figure className="md:col-span-2">
            <div className="bg-muted overflow-hidden rounded-lg">
              <img
                src={heroImage ?? fallbackImage}
                alt={cluster.title}
                className="h-auto w-full object-cover"
                style={{
                  aspectRatio: "16/9",
                  viewTransitionName: "article-image",
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
          <h2 className="text-primary mb-6 text-2xl font-bold md:text-3xl">
            Pokritje iz {cluster.articles.length}{" "}
            {resolvePlural({
              count: cluster.articles.length,
              singular: "članek",
              dual: "članka",
              plural: "člankov",
            })}
          </h2>

          <div className="space-y-1">
            {cluster.articles.map((article, index) => {
              const publishDate = new Date(article.publishedAt);
              return (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={article.id}
                  className="group hover:bg-muted/50 block border-b border-white/50 py-6 transition-colors last:border-b-0"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-card ring-border flex h-12 w-12 items-center justify-center overflow-hidden rounded-md ring-1">
                        <img
                          src={`${config.imagesUrl}/providers/${article.newsProviderKey}.webp`}
                          alt={article.newsProviderKey}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono tracking-wider uppercase">
                          {article.newsProviderKey}
                        </span>
                        <span>•</span>
                        <time dateTime={article.publishedAt}>
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
                        {article.author && (
                          <>
                            <span>•</span>
                            <span>{article.author}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-primary group-hover:text-accent mb-2 text-xl leading-snug font-semibold text-pretty transition-colors md:text-2xl">
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed text-pretty">
                          {article.summary}
                        </p>
                      )}

                      <div className="text-accent mt-3 flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                        <span>Preberi cel članek</span>
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
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
    <div className="bg-card mb-12 rounded-lg border border-white/20 p-6">
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
    </div>
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
              })}{" "}
              –{" "}
              {newestDate.toLocaleTimeString("sl-SI", {
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
    <div className="bg-muted/30 mt-12 rounded-lg border border-white/20 p-6 text-center">
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
          {providerCount} različnih virov
        </strong>
        . Nazadnje posodobljeno{" "}
        {newestDate.toLocaleDateString("sl-SI", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        .
      </p>
    </div>
  );
}

export function meta({ params, data }: Route.MetaArgs): Route.MetaDescriptors {
  const title = data.cluster.title;
  const imageUrl =
    "https://media.gettyimages.com/id/165088089/photo/the-word-news-under-a-magnifying-glass-among-stacks-of-paper.jpg?s=612x612&w=gi&k=20&c=o6Ni4rERiNG88MYs7ZSK-riEPOdftUTAgIjW9zGSodU=";
  return getSeoMetas({
    title,
    description: "Article summary goes here.",
    image: imageUrl,
    url: `https://vidik.si/article/${params.articleId}`,
    // keywords: "vidik, article, news, slovenia",
    ogType: "article",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
