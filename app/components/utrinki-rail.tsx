import { useMemo } from "react";
import { Link } from "react-router";
import { Play } from "lucide-react";
import { config } from "~/config";
import { useLocalStorage } from "~/hooks/use-local-storage";
import type { ArticleType, ArticlesByCategory } from "~/lib/services/ranking";
import { cn } from "~/lib/utils";
import { utrinkiStoryHref } from "~/lib/utrinki/model";
import {
  isDeprioritized,
  orderFeed,
  sanitizeHidden,
  sanitizeSeen,
  UTRINKI_KEYS,
  type HiddenMap,
  type SeenMap,
} from "~/lib/utrinki/store";

/** Circles shown in the row. */
export const RAIL_SIZE = 12;
/** Stories kept in reserve so watched ones can be swapped for unwatched ones. */
const POOL_SIZE = 48;
const EMPTY_MAP = {};

export type RailStory = {
  id: number;
  title: string;
  imageUrl: string | null;
  updatedAt: string | null;
  bias: ArticleType["biasDistribution"];
};

/** Story id from a listing card, or null for cluster (clanek) cards. */
function storyIdOf(article: ArticleType) {
  const match = article.to?.match(/^\/zgodba\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

/**
 * Candidate stories in rank order: home stories first (same order as the
 * reel), then the top story of each category, then the rest of each
 * category taken in turns, without repeats.
 */
export function railStories(
  home: readonly ArticleType[],
  byCategory: ArticlesByCategory,
): RailStory[] {
  const picked: RailStory[] = [];
  const seen = new Set<number>();
  const add = (article: ArticleType | undefined) => {
    if (!article || picked.length >= POOL_SIZE) return;
    const id = storyIdOf(article);
    if (id === null || seen.has(id)) return;
    seen.add(id);
    picked.push({
      id,
      title: article.title,
      imageUrl: article.image.src || null,
      updatedAt: article.lastPublishedAt ?? null,
      bias: article.biasDistribution,
    });
  };
  for (const article of home) add(article);
  const lists = config.categories.map((category) => byCategory[category.key]);
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let rank = 0; rank < longest; rank++) {
    for (const list of lists) add(list[rank]);
  }
  return picked;
}

/**
 * The circles to show: unwatched stories first (even older ones), watched
 * ones only to fill the row, hidden ones never. Same rule as the reel.
 */
export function visibleRailStories(
  pool: readonly RailStory[],
  seen: SeenMap,
  hidden: HiddenMap,
): RailStory[] {
  const byId = new Map(pool.map((story) => [story.id, story]));
  return orderFeed(
    pool.map(({ id, updatedAt }) => ({ id, updatedAt: updatedAt ?? "" })),
    seen,
    hidden,
  )
    .slice(0, RAIL_SIZE)
    .map(({ id }) => byId.get(id)!);
}

/** The ring shows how outlets are split: left red, centre grey, right blue. */
function ringGradient(bias: RailStory["bias"]) {
  if (bias.totalCount === 0) return "#0084e5";
  const left = bias.leftPercent;
  const center = left + bias.centerPercent;
  return `conic-gradient(#ff5a5f 0 ${left}%, #c8c8c8 ${left}% ${center}%, #2d7eff ${center}% 100%)`;
}

/**
 * Row of story circles at the top of the home page. The first
 * circle opens the reel; each story opens the reel on that story.
 */
export function UtrinkiRail({ stories: pool }: { stories: RailStory[] }) {
  const [seenRaw] = useLocalStorage<unknown>(UTRINKI_KEYS.seen, EMPTY_MAP);
  const [hiddenRaw] = useLocalStorage<unknown>(UTRINKI_KEYS.hidden, EMPTY_MAP);
  const seen = useMemo(() => sanitizeSeen(seenRaw), [seenRaw]);
  const stories = useMemo(
    () => visibleRailStories(pool, seen, sanitizeHidden(hiddenRaw)),
    [pool, seen, hiddenRaw],
  );
  if (stories.length === 0) return null;

  return (
    <nav
      aria-label="Utrinki"
      className="col-span-full -mx-3 -mt-1 md:mx-0 md:mt-0"
    >
      <ul className="flex snap-x scroll-px-3 gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:scroll-px-0 md:gap-4 md:px-0 [&::-webkit-scrollbar]:hidden">
        <li className="snap-start">
          <Link
            to="/utrinki"
            prefetch="intent"
            className="flex w-[68px] flex-col items-center gap-1.5 focus-visible:outline-none"
          >
            <span className="grid size-[64px] place-items-center rounded-full bg-[#0084e5] text-white shadow-[0_6px_16px_-6px_rgba(0,132,229,0.8)]">
              <Play
                className="size-6 translate-x-[1px] fill-current"
                aria-hidden
              />
            </span>
            <span className="text-[12px] leading-tight font-bold">Utrinki</span>
          </Link>
        </li>
        {stories.map((story) => {
          const watched = isDeprioritized(
            story.updatedAt ?? "",
            seen[String(story.id)],
          );
          return (
            <li key={story.id} className="snap-start">
              <Link
                to={utrinkiStoryHref(story.id)}
                prefetch="intent"
                className="group flex w-[68px] flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "size-[64px] rounded-full p-[2.5px] group-focus-visible:ring-2 group-focus-visible:ring-[#0084e5]",
                    watched && "opacity-55",
                  )}
                  style={{
                    background: watched
                      ? "var(--color-surface-text)"
                      : ringGradient(story.bias),
                  }}
                >
                  <span className="border-surface bg-surface-text/10 block size-full overflow-hidden rounded-full border-2">
                    {story.imageUrl && (
                      <img
                        src={story.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "line-clamp-2 text-center text-[11px] leading-[13px] font-semibold",
                    watched && "text-surface-text/55",
                  )}
                >
                  {story.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
