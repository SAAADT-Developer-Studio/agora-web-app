import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";
import { getSeoMetas } from "~/lib/seo";

export function loader({ params, context }: Route.LoaderArgs) {
  const articleId = params.articleId;

  return {
    articleId,
  };
}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
//   const articleId = params.articleId;
//   return sharedLoader();
// }

export default function ArticlePage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Article Page</h1>
      <p>This is a placeholder for the article content.</p>
    </div>
  );
}

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  const title = "TODO";
  const imageUrl =
    "https://media.gettyimages.com/id/165088089/photo/the-word-news-under-a-magnifying-glass-among-stacks-of-paper.jpg?s=612x612&w=gi&k=20&c=o6Ni4rERiNG88MYs7ZSK-riEPOdftUTAgIjW9zGSodU=";
  return getSeoMetas({
    title: "todo",
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
