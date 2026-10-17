import type { Route } from "./+types/story";
import { ErrorComponent } from "~/components/error-component";
import {
  breadcrumbJsonLd,
  getSeoMetas,
  newsArticleJsonLd,
  SITE_URL,
} from "~/lib/seo";
import { UNINDEXED_ROBOTS } from "~/lib/seo/unindexed";
import { getAppContext } from "~/lib/appContext";
import { extractHeroImage } from "~/utils/extractHeroImage";
import { collectSocialMentions } from "~/utils/socialPost";
import { parseStoryBullets } from "~/utils/storySummary";
import StoryPage, { type StoryPageData } from "~/components/story-page";

/** A story whose newest article is younger than this reads as developing. */
const DEVELOPING_WINDOW_MS = 3 * 60 * 60 * 1000;

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "max-age=10, s-maxage=10",
    "X-Robots-Tag": UNINDEXED_ROBOTS,
  };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  if (!loaderData?.story) {
    return getSeoMetas({
      title: "Zgodba ni najdena | Vidik",
      description: "Oprostite, iskana zgodba ni bila najdena.",
      pathname: location.pathname,
      robots: UNINDEXED_ROBOTS,
      includeSiteSchema: false,
    });
  }

  const { story, articles, uniqueCategories, heroImageUrl } = loaderData;
  const title = story.title;
  const providers = Array.from(
    new Map(
      articles.map((a) => [a.newsProviderKey, a.newsProvider.name]),
    ).values(),
  );
  const publishedTimes = articles.map((a) => new Date(a.publishedAt).getTime());
  const publishedTime = new Date(Math.min(...publishedTimes)).toISOString();
  const modifiedTime = new Date(Math.max(...publishedTimes)).toISOString();
  const description =
    story.bullets[0]?.text ??
    `Primerjava poročanja ${providers.length} slovenskih medijev o temi »${title}«. Viri: ${providers.slice(0, 5).join(", ")}${providers.length > 5 ? " in drugi" : ""}.`;
  const pageUrl = new URL(location.pathname, SITE_URL).href;

  return getSeoMetas({
    title: `${title} | Vidik`,
    description,
    image: heroImageUrl || undefined,
    pathname: location.pathname,
    robots: UNINDEXED_ROBOTS,
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
        sources: articles.map((a) => ({
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
    throw new Response("Story Not Found", { status: 404 });
  }
  const storyId = Number.parseInt(rawId, 10);

  const { db, measurer } = getAppContext(context);

  const story = await measurer.time("fetchStoryData", () =>
    db.query.story.findFirst({
      where: (s, { eq }) => eq(s.id, storyId),
      columns: { id: true, title: true },
      with: {
        storySummaries: {
          columns: { title: true, bullets: true },
          orderBy: (s, { desc }) => [desc(s.id)],
          limit: 1,
        },
        storyArticles: {
          columns: {},
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
              with: {
                newsProvider: true,
                articleSocialPosts: {
                  columns: {},
                  with: {
                    socialPost: {
                      columns: {
                        id: true,
                        platform: true,
                        url: true,
                        postedAt: true,
                        platformMetadata: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  );

  if (!story || story.storyArticles.length === 0) {
    throw new Response("Story Not Found", { status: 404 });
  }

  const members = story.storyArticles.map((sa) => sa.article_articleId);
  members.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  // Members without the relations the page doesn't render; scraped titles
  // can still carry escaped quotes.
  const articles = members.map(
    ({ articleSocialPosts: _, categories: __, ...article }) => ({
      ...article,
      title: article.title.replaceAll("&quot;", '"'),
    }),
  );
  const summary = story.storySummaries.at(0);
  const newest = Date.parse(members[0].publishedAt);

  return {
    story: {
      id: story.id,
      title: summary?.title ?? story.title,
      bullets: parseStoryBullets(
        summary?.bullets,
        new Set(members.map((a) => a.id)),
      ),
      isDeveloping: Date.now() - newest < DEVELOPING_WINDOW_MS,
    },
    articles,
    mentions: collectSocialMentions(members),
    uniqueCategories: Array.from(
      new Set(members.flatMap((a) => a.categories || [])),
    ),
    heroImageUrl: extractHeroImage(articles),
  } satisfies StoryPageData;
}

export default function StoryRoute({ loaderData }: Route.ComponentProps) {
  return <StoryPage data={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
