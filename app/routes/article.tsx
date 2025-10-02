import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import fallbackArticleImage from "~/assets/fallback.png";

export async function loader({ params, context }: Route.LoaderArgs) {
  // TODO: handle numeric id and slug
  /*const articleId = params.articleId;
  const db = await getDb();

  const cluster = await db.query.cluster.findFirst({
    where: eq(clusterSchema.id, parseInt(articleId)),
    with: {
      articles: true,
    },
  });

  if (!cluster) {
    throw new Response("Article Not Found", { status: 404 });
  }

  return {
    cluster,
  };*/

  const cluster = {
    id: 1,
    title: "Sample Cluster Title",
    image: fallbackArticleImage,
    description: "This is a sample cluster description.",
    articles: [
      {
        id: 1,
        title: "Article 1",
        summary:
          "This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, This is a summary for Article 1, ",
        provider: { name: "RTV", logo: fallbackArticleImage, side: "left" },
      },
      {
        id: 2,
        title: "Article 2",
        summary:
          "This is a summary for Article 2, This is a summary for Article 2, This is a summary for Article 2, This is a summary for Article 2, This is a summary for Article 2, This is a summary for Article 2,",
        provider: { name: "Delo", logo: fallbackArticleImage, side: "right" },
      },
      {
        id: 3,
        title: "Article 3",
        summary:
          "This is a summary for Article 3, This is a summary for Article 3, This is a summary for Article 3, This is a summary for Article 3, This is a summary for Article 3, This is a summary for Article 3,",
        provider: { name: "24ur", logo: fallbackArticleImage, side: "center" },
      },
    ],
  };
  return { cluster };
}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
//   const articleId = params.articleId;
//   return sharedLoader();
// }

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { cluster } = loaderData;
  console.log({ cluster });
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold">{cluster.title}</h1>
      <div>{cluster.articles.length} člankov</div>
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
