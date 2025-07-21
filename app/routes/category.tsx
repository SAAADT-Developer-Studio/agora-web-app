import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/category";
import { config } from "~/config";

// TODO: add a key property to the config.categories array?
const categorySet = new Set(config.categories.map((c) => c.path.slice(1)));

export async function loader({ params }: Route.LoaderArgs) {
  const category = params.category;
  if (!categorySet.has(category)) {
    throw new Response("Category Not Found", { status: 404 });
  }
  // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate a delay
}

// export async function clientLoader({ params }: Route.ClientLoaderArgs) {
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
      title: `${params.category.toUpperCase()} | Vidik`,
      name: "description",
      content: "Explore various categories of articles.",
    },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
