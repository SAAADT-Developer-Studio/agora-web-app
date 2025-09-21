import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";
import { getDb } from "~/lib/db";
import { eq } from "drizzle-orm";
import { cluster as clusterSchema } from "~/drizzle/schema";

export async function loader({ params, context }: Route.LoaderArgs) {
  // TODO: handle numeric id and slug
  const articleId = params.articleId;
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
  };
}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
//   const articleId = params.articleId;
//   return sharedLoader();
// }

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { cluster } = loaderData;
  console.log({ cluster });
  return (
    <div className="p-4">
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
