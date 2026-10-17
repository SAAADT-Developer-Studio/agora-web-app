import type { Route } from "./+types/story";
import { ErrorComponent } from "~/components/error-component";
import {
  breadcrumbJsonLd,
  getSeoMetas,
  newsArticleJsonLd,
  SITE_URL,
} from "~/lib/seo";
import { getAppContext } from "~/lib/appContext";
import { extractHeroImage } from "~/utils/extractHeroImage";
import ArticlePage, { type ArticlePageData } from "~/components/article-page";

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "max-age=10, s-maxage=10",
  };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  if (!loaderData?.cluster) {
    return getSeoMetas({
      title: "Zgodba ni najdena | Vidik",
      description: "Oprostite, iskana zgodba ni bila najdena.",
      pathname: location.pathname,
      noindex: true,
      includeSiteSchema: false,
    });
  }

  const { cluster, uniqueCategories, heroImageUrl } = loaderData;
  const title = cluster.title;
  const providers = Array.from(
    new Map(
      cluster.articles.map((a) => [a.newsProviderKey, a.newsProvider.name]),
    ).values(),
  );
  const publishedTimes = cluster.articles.map((a) =>
    new Date(a.publishedAt).getTime(),
  );
  const publishedTime = new Date(Math.min(...publishedTimes)).toISOString();
  const modifiedTime = new Date(Math.max(...publishedTimes)).toISOString();
  const description = `Primerjava poročanja ${providers.length} slovenskih medijev o temi »${title}«. Viri: ${providers.slice(0, 5).join(", ")}${providers.length > 5 ? " in drugi" : ""}.`;
  const pageUrl = new URL(location.pathname, SITE_URL).href;

  return getSeoMetas({
    title: `${title} | Vidik`,
    description,
    image: heroImageUrl || undefined,
    pathname: location.pathname,
    keywords: [...uniqueCategories, ...providers.slice(0, 5), "vidik"].join(
      ", ",
    ),
    ogType: "article",
    publishedTime,
    modifiedTime,
    authors: providers,
    jsonLd: [
      newsArticleJsonLd({
        headline: title,
        description,
        image: heroImageUrl || undefined,
        url: pageUrl,
        datePublished: publishedTime,
        dateModified: modifiedTime,
        keywords: uniqueCategories,
        sources: cluster.articles.map((a) => ({
          title: a.title,
          url: a.url,
          publishedAt: new Date(a.publishedAt).toISOString(),
          providerName: a.newsProvider.name,
        })),
      }),
      breadcrumbJsonLd([
        { name: "Domov", path: "/" },
        { name: title, path: location.pathname },
      ]),
    ],
  });
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const rawId = params.storyId;
  if (!rawId || !/^\d+$/.test(rawId)) {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: { "X-Robots-Tag": "noindex" },
    });
  }
  const storyId = Number.parseInt(rawId, 10);

  const { db, measurer } = getAppContext(context);

  const story = await measurer.time("fetchStoryData", () =>
    db.query.story.findFirst({
      where: (s, { eq }) => eq(s.id, storyId),
      with: {
        storyArticles: {
          with: {
            article_articleId: {
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
    }),
  );

  if (!story) {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  const articles = story.storyArticles
    .map((sa) => sa.article_articleId)
    .filter((article) => article != null);
  if (articles.length === 0) {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: { "X-Robots-Tag": "noindex" },
    });
  }
  articles.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return {
    cluster: {
      id: story.id,
      title: story.title,
      articles,
    },
    uniqueCategories: Array.from(
      new Set(articles.flatMap((a) => a.categories || [])),
    ),
    heroImageUrl: extractHeroImage(articles),
  } satisfies ArticlePageData;
}

export default function StoryPage({ loaderData }: Route.ComponentProps) {
  return <ArticlePage loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
