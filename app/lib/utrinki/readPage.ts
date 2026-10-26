import { getAppContext } from "~/lib/appContext";
import { utrinkiCacheKey } from "~/lib/kvCache/keys";
import { getMaxAge } from "~/utils/getMaxAge";
import { loadUtrinkiPage } from "~/lib/utrinki/load";
import { parseUtrinkiQuery, type UtrinkiPage } from "~/lib/utrinki/model";

export async function readUtrinkiPage(
  request: Request,
  context: Parameters<typeof getAppContext>[0],
): Promise<{ page: UtrinkiPage; cacheControl: string }> {
  const url = new URL(request.url);
  const query = parseUtrinkiQuery(url.searchParams);

  if (import.meta.env.DEV && url.searchParams.get("osnutek") === "1") {
    const { fixtureUtrinkiPage } = await import("~/lib/utrinki/fixtures");
    return {
      page: { ...fixtureUtrinkiPage(query), draft: true },
      cacheControl: "no-store",
    };
  }

  const { db, kvCache, measurer } = getAppContext(context);
  const page = await measurer.time("fetchUtrinki", () =>
    kvCache.cached(() => loadUtrinkiPage({ db, ...query }), {
      key: utrinkiCacheKey(query.category, query.page),
      expirationTtl: 10 * 60,
    }),
  );
  const maxAge = await getMaxAge(kvCache);
  return {
    page,
    cacheControl: `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${5 * 60}, stale-if-error=${3 * 60 * 60}`,
  };
}
