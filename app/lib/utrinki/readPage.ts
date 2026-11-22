import { getAppContext } from "~/lib/appContext";
import { utrinkiCacheKey } from "~/lib/kvCache/keys";
import { storyRankOrderFromEnv } from "~/lib/storyRankOrder";
import { getMaxAge } from "~/utils/getMaxAge";
import { hydrateUtrinkiStories, loadUtrinkiPage } from "~/lib/utrinki/load";
import {
  parseUtrinkiFocus,
  parseUtrinkiQuery,
  withFocusedStory,
  type UtrinkiPage,
} from "~/lib/utrinki/model";

export async function readUtrinkiPage(
  request: Request,
  context: Parameters<typeof getAppContext>[0],
): Promise<{ page: UtrinkiPage; cacheControl: string }> {
  const url = new URL(request.url);
  const query = parseUtrinkiQuery(url.searchParams);
  // Only the first page opens on a story; later pages are continuations.
  const focus = query.page === 0 ? parseUtrinkiFocus(url.searchParams) : null;

  if (import.meta.env.DEV && url.searchParams.get("osnutek") === "1") {
    const { fixtureUtrinkiPage } = await import("~/lib/utrinki/fixtures");
    const fixture = { ...fixtureUtrinkiPage(query), draft: true };
    return {
      page: focus
        ? await withFocusedStory(fixture, focus, async () => null)
        : fixture,
      cacheControl: "no-store",
    };
  }

  const { db, kvCache, measurer, cloudflare } = getAppContext(context);
  const storyRankOrder = storyRankOrderFromEnv(cloudflare.env);
  const cachedPage = await measurer.time("fetchUtrinki", () =>
    kvCache.cached(() => loadUtrinkiPage({ db, ...query, storyRankOrder }), {
      key: utrinkiCacheKey(query.category, query.page, storyRankOrder),
      expirationTtl: 10 * 60,
    }),
  );
  // The cached page is shared; the focused story is added per request.
  const page = focus
    ? await withFocusedStory(cachedPage, focus, async (id) => {
        const [story] = await hydrateUtrinkiStories(db, [id]);
        return story ?? null;
      })
    : cachedPage;
  const maxAge = await getMaxAge(kvCache);
  return {
    page,
    cacheControl: `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${5 * 60}, stale-if-error=${3 * 60 * 60}`,
  };
}
