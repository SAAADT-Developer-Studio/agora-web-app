import { getAppContext } from "~/lib/appContext";
import type { Route } from "./+types/category";
import { isCategoryKey } from "~/config";
import {
  createObservedRankSession,
  getStoryCategoryArticles,
  resolveObservedStoryRankRun,
} from "~/lib/services/storyRanking";
import { storyRankOrderFromEnv } from "~/lib/storyRankOrder";

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
  if (!isCategoryKey(category)) {
    throw new Response("Category Not Found", { status: 404 });
  }
  const { db, cloudflare } = getAppContext(context);
  const rankSession = createObservedRankSession();
  const observedRunId = await resolveObservedStoryRankRun(
    db,
    storyRankOrderFromEnv(cloudflare.env),
    rankSession,
  );
  const articles = await getStoryCategoryArticles({
    db,
    ignoredClusterIds: [],
    category,
    count: Number(count),
    offset: Number(offset) || 0,
    observedRunId,
    rankSession,
  });
  return { articles };
}
