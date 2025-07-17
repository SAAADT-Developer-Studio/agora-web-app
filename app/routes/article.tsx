import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/article";

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
  const summary = "Article summary goes here.";
  const imageUrl =
    "https://media.gettyimages.com/id/165088089/photo/the-word-news-under-a-magnifying-glass-among-stacks-of-paper.jpg?s=612x612&w=gi&k=20&c=o6Ni4rERiNG88MYs7ZSK-riEPOdftUTAgIjW9zGSodU=";
  return [
    {
      title: `${title} | Vidik.si`,
      name: "description",
      content: summary,
    },
    {
      name: "og:title",
      content: title,
    },
    {
      name: "og:description",
      content: summary,
    },
    {
      name: "og:type",
      content: "article",
    },
    {
      name: "og:image",
      content: imageUrl,
    },
    {
      name: "og:url",
      content: `https://vidik.si/article/${params.articleId}`,
    },
    {
      name: "twitter:title",
      content: title,
    },
    {
      name: "twitter:description",
      content: summary,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:image",
      content: imageUrl,
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
