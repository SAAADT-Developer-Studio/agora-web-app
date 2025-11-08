import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import fallbackArticleImage from "~/assets/fallback.png";
import { Info, Newspaper, Calendar, SatelliteDish } from "lucide-react";
import { resolvePlural } from "~/utils/resolvePlural";
import { getBiasDistribution } from "~/utils/getBiasDistribution";
import { BiasDistribution } from "~/components/bias-distribution";
import { isSameHour } from "~/utils/isSameHour";
import { extractHeroImage } from "~/utils/extractHeroImage";
import { Link } from "react-router";
import { InfoCard } from "~/components/ui/info-card";
import { ArticleItem } from "~/components/article-item";
import type { Database } from "~/lib/db";

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
};

async function fetchClusterData({
  db,
  articleId,
}: {
  db: Database;
  articleId: string;
}) {
  return await db.query.clusterV2.findFirst({
    where: (clusterV2, { eq }) => {
      if (Number.isInteger(Number.parseInt(articleId))) {
        return eq(clusterV2.id, Number.parseInt(articleId));
      }
      return eq(clusterV2.slug, articleId);
    },
    with: {
      articleClusters: {
        with: {
          article: {
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
              isPaywalled: true,
            },
            with: { newsProvider: true },
          },
        },
      },
    },
  });
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;
  const db = context.db;

  const cluster = await context.measurer.time("fetchClusterData", () =>
    fetchClusterData({ db, articleId }),
  );

  if (!cluster) {
    throw new Response("Article Not Found", { status: 404 });
  }

  const articles = cluster.articleClusters.map((ac) => ac.article);

  const heroImageUrl = extractHeroImage(
    articles.map((a) => {
      return {
        url: a.imageUrls ? a.imageUrls[0] : fallbackArticleImage,
        providerKey: a.newsProviderKey,
        providerRank: a.newsProvider.rank,
      };
    }),
  );

  articles.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  const allCategories = articles.flatMap((a) => a.categories || []);
  const uniqueCategories = Array.from(new Set(allCategories));

  return {
    cluster: {
      id: cluster.id,
      title: cluster.title,
      articles,
    },
    uniqueCategories,
    heroImageUrl,
  } satisfies ArticlePageData;
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
            <span className="flex gap-3" key={category}>
              <span>•</span>
              <span className="capitalize">{category}</span>
            </span>
          ))}
        </div>

        <h1 className="text-primary mb-8 line-clamp-3 text-xl leading-normal font-bold tracking-tight text-balance md:text-3xl md:leading-tight lg:text-4xl">
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
            {cluster.articles.map((article) => (
              <ArticleItem key={article.id} article={article} />
            ))}
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
