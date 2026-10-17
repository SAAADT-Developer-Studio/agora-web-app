import { redirect } from "react-router";
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
import {
  classifyStoryParam,
  persistedStoryStatus,
  storyPath,
} from "~/lib/articleUrl";

const GONE_HEADERS = {
  "X-Robots-Tag": "noindex",
  "Cache-Control": "public, max-age=300",
};

const NOT_FOUND_HEADERS = {
  "X-Robots-Tag": "noindex",
  "Cache-Control": "public, max-age=60",
};

export function headers({ errorHeaders, loaderHeaders }: Route.HeadersArgs) {
  // Thrown 301/404/410 responses carry Location, Cache-Control, and
  // X-Robots-Tag. Replacing them with only Cache-Control drops noindex.
  if (errorHeaders) return errorHeaders;
  if (loaderHeaders.has("Location")) return loaderHeaders;
  return {
    "Cache-Control": "max-age=10, s-maxage=10",
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.cluster) {
    return getSeoMetas({
      title: "Zgodba ni najdena | Vidik",
      description: "Oprostite, iskana zgodba ni bila najdena.",
      pathname: "/",
      canonical: false,
      noindex: true,
      includeSiteSchema: false,
    });
  }

  const { cluster, uniqueCategories, heroImageUrl } = loaderData;
  const title = cluster.title;
  const path = storyPath(cluster.id);
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
  const pageUrl = new URL(path, SITE_URL).href;

  return getSeoMetas({
    title: `${title} | Vidik`,
    description,
    image: heroImageUrl || undefined,
    pathname: path,
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
        { name: title, path },
      ]),
    ],
  });
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const classified = classifyStoryParam(params.storyId);
  if (classified.type === "not-found") {
    throw new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: NOT_FOUND_HEADERS,
    });
  }

  const url = new URL(request.url);
  const canonical = storyPath(classified.id);
  if (classified.type === "redirect" || url.pathname !== canonical) {
    throw redirect(`${canonical}${url.search}`, {
      status: 301,
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  const { db, measurer } = getAppContext(context);

  const story = await measurer.time("fetchStoryData", () =>
    db.query.story.findFirst({
      where: (s, { eq }) => eq(s.id, classified.id),
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
    throw new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
      headers: NOT_FOUND_HEADERS,
    });
  }

  const articles = story.storyArticles
    .map((sa) => sa.article_articleId)
    .filter((article) => article != null);
  if (persistedStoryStatus(articles.length) === 410) {
    throw new Response("Gone", {
      status: 410,
      statusText: "Gone",
      headers: GONE_HEADERS,
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
