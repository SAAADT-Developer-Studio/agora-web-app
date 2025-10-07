import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import fallbackArticleImage from "~/assets/fallback.png";
import { getDb } from "~/lib/db";
import { article, cluster as clusterSchema } from "~/drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "~/config";
import { Info, Newspaper, Calendar, TrendingUp } from "lucide-react";

export async function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;
  const db = await getDb();

  const cluster = await db.query.cluster.findFirst({
    where: eq(clusterSchema.id, Number.parseInt(articleId)),
    with: {
      articles: true,
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
  const providerBiasRatings = [
    {
      img: `${config.imagesUrl}/providers/delo.webp`,
      bias: "center",
    },
    {
      img: `${config.imagesUrl}/providers/rtv.webp`,
      bias: "left-center",
    },
    {
      img: `${config.imagesUrl}/providers/24ur.webp`,
      bias: "right-center",
    },
    {
      img: `${config.imagesUrl}/providers/siol.webp`,
      bias: "right",
    },
    {
      img: `${config.imagesUrl}/providers/vecer.webp`,
      bias: "left",
    },
    {
      img: `${config.imagesUrl}/providers/n1info.webp`,
      bias: "right",
    },
    {
      img: `${config.imagesUrl}/providers/primorskenovice.webp`,
      bias: "left-center",
    },
    {
      img: `${config.imagesUrl}/providers/maribor24.webp`,
      bias: "center",
    },
  ];

  const biasCategories = [
    {
      key: "left",
      label: "LEFT",
      barColor: "bg-blue-500",
      textColor: "text-white",
    },
    {
      key: "left-center",
      label: "CENTER-LEFT",
      barColor: "bg-blue-400",
      textColor: "text-gray-800",
    },
    {
      key: "center",
      label: "CENTER",
      barColor: "bg-white",
      textColor: "text-gray-800",
    },
    {
      key: "right-center",
      label: "CENTER-RIGHT",
      barColor: "bg-red-300",
      textColor: "text-gray-800",
    },
    {
      key: "right",
      label: "RIGHT",
      barColor: "bg-red-500",
      textColor: "text-white",
    },
  ];

  const providersByBias = biasCategories.map((category) => ({
    ...category,
    providers: providerBiasRatings.filter((p) => p.bias === category.key),
  }));

  const dates = cluster.articles.map((a) => new Date(a.publishedAt));
  const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const allCategories = cluster.articles.flatMap((a) => a.categories || []);
  const uniqueCategories = [...new Set(allCategories)];

  const uniqueProviders = [
    ...new Set(cluster.articles.map((a) => a.newsProviderKey)),
  ];

  const heroImage =
    cluster.articles[0] && cluster.articles[0].imageUrls
      ? (cluster.articles[0].imageUrls[0] ?? fallbackArticleImage)
      : fallbackArticleImage;

  const leftCount = providerBiasRatings.filter(
    (p) => p.bias === "left" || p.bias === "left-center",
  ).length;
  const centerCount = providerBiasRatings.filter(
    (p) => p.bias === "center",
  ).length;
  const rightCount = providerBiasRatings.filter(
    (p) => p.bias === "right" || p.bias === "right-center",
  ).length;
  const totalCount = providerBiasRatings.length;

  const leftPercent = Math.round((leftCount / totalCount) * 100);
  const centerPercent = Math.round((centerCount / totalCount) * 100);
  const rightPercent = Math.round((rightCount / totalCount) * 100);

  return (
    <div className="bg-background min-h-screen">
      <article className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono tracking-wider uppercase">vidik</span>
          {uniqueCategories.length > 0 && (
            <>
              <span>•</span>
              <span className="capitalize">{uniqueCategories[0]}</span>
            </>
          )}
        </div>

        <h1 className="text-primary mb-8 text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
          {cluster.title}
        </h1>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <figure className="md:col-span-2">
            <div className="bg-muted overflow-hidden rounded-lg">
              <img
                src={heroImage || "/placeholder.svg"}
                alt={cluster.title}
                className="h-auto w-full object-cover"
                style={{ aspectRatio: "16/9" }}
              />
            </div>
          </figure>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-[#4a4a4a] p-4 md:col-span-1">
            <h2 className="font-bold tracking-wide text-gray-200 uppercase">
              Provider Bias Rating
            </h2>

            <div className="my-6 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
                  Left
                </div>
                <div className="text-xl font-bold text-gray-100">
                  {leftPercent}%
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                  Center
                </div>
                <div className="text-xl font-bold text-gray-100">
                  {centerPercent}%
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wider text-red-400 uppercase">
                  Right
                </div>
                <div className="text-xl font-bold text-gray-100">
                  {rightPercent}%
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-5 gap-2">
              {providersByBias.map((category) => (
                <div
                  key={category.key}
                  className="flex flex-col overflow-hidden rounded-lg bg-[#2a2a2a]"
                >
                  <div className={`h-2 ${category.barColor}`} />
                  <div className="px-2 pt-4">
                    <div className="flex flex-col items-center gap-2">
                      {category.providers.map((provider, idx) => (
                        <div
                          key={idx}
                          className="border-primary flex w-full items-center justify-center overflow-hidden rounded-full border-2 bg-blue-600"
                        >
                          <img
                            src={provider.img || "/placeholder.svg"}
                            alt="Provider"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-border bg-card mb-12 rounded-lg border p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Info className="text-accent mt-1 h-5 w-5 flex-shrink-0" />
              <div>
                <h2 className="text-card-foreground mb-2 font-semibold">
                  <b>NEWS CLUSTER</b>
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  <b>NEWS CLUSTER</b> združuje več člankov iz različnih virov,
                  ki pokrivajo isto zgodbo. To vam omogoča celovit pogled na to,
                  kako različni mediji poročajo o istem dogodku.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 md:flex-shrink-0">
              <div className="flex items-center gap-3">
                <Newspaper className="text-muted-foreground h-6 w-6" />
                <div>
                  <div className="text-primary text-2xl font-bold">
                    {cluster.articles.length}
                  </div>
                  <div className="text-muted-foreground text-xs">Articles</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="text-muted-foreground h-6 w-6" />
                <div>
                  <div className="text-primary text-2xl font-bold">
                    {uniqueProviders.length}
                  </div>
                  <div className="text-muted-foreground text-xs">Sources</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground h-6 w-6" />
                <div>
                  <div className="text-primary text-sm font-semibold">
                    {oldestDate.toLocaleDateString("sl-SI", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {newestDate.toLocaleDateString("sl-SI", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Date Range
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-primary mb-6 text-2xl font-bold md:text-3xl">
            Pokritje iz {cluster.articles.length} člankov
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
                  className="group border-border hover:bg-muted/50 block border-b py-6 transition-colors last:border-b-0"
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
                          at{" "}
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
                        <p className="text-muted-foreground leading-relaxed text-pretty">
                          {article.summary}
                        </p>
                      )}

                      <div className="text-accent mt-3 flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                        <span>Read full article</span>
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

        <div className="border-border bg-muted/30 mt-12 rounded-lg border p-6 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            This cluster was automatically generated by analyzing{" "}
            <strong className="text-primary font-semibold">
              {cluster.articles.length} articles
            </strong>{" "}
            from{" "}
            <strong className="text-primary font-semibold">
              {uniqueProviders.length} different sources
            </strong>
            . Last updated on{" "}
            {newestDate.toLocaleDateString("sl-SI", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </div>
      </article>
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
