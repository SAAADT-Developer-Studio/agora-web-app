import type { Route } from "./+types/utrinki";
import { UNINDEXED_ROBOTS } from "~/lib/seo/unindexed";
import { readUtrinkiPage } from "~/lib/utrinki/readPage";

/**
 * GET-only page of stories for "Starejši sklopi".
 * Failures stay JSON so the reel's document ErrorBoundary is not replaced.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const { page, cacheControl } = await readUtrinkiPage(request, context);
    return Response.json(page, {
      headers: {
        "Cache-Control": cacheControl,
        "X-Robots-Tag": UNINDEXED_ROBOTS,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: true },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": UNINDEXED_ROBOTS,
        },
      },
    );
  }
}
