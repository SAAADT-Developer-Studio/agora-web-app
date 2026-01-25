import type { Route } from "./+types/category";
import { config } from "~/config";
import { getCategoryArticles } from "~/lib/services/ranking";

const categorySet = new Set<string>(config.categories.map((c) => c.key));

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const category = params.category;
  const count = new URL(request.url).searchParams.get("count");
  const offset = new URL(request.url).searchParams.get("offset");

  if (count === null) {
    throw new Response("Missing count parameter", { status: 400 });
  }
  if (
    isNaN(Number(count)) ||
    Number(count) <= 0 ||
    !Number.isInteger(Number(count))
  ) {
    throw new Response("Invalid count parameter", { status: 400 });
  }
  if (category === undefined || category === null) {
    throw new Response("Missing category parameter", { status: 400 });
  }
  if (!categorySet.has(category)) {
    throw new Response("Category Not Found", { status: 404 });
  }
  const articles = await getCategoryArticles({
    db: context.db,
    ignoredClusterIds: [],
    category,
    count: Number(count),
    offset: Number(offset) || 0,
  });
  return { articles };
}
