import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/category";

export function loader({ params }: Route.LoaderArgs) {
  const category = params.category;
}

// export function clientLoader({ params }: Route.ClientLoaderArgs) {
// }

export default function CategoryPage({}: Route.ComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Category Page</h1>
      <p>This is a placeholder for the category content.</p>
    </div>
  );
}

export function meta({ params }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: "Category",
      name: "description",
      content: "Explore various categories of articles.",
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
