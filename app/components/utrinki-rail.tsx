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
  sanitizeSeen,
  UTRINKI_KEYS,
} from "~/lib/utrinki/store";

const MAX_STORIES = 12;
const EMPTY_SEEN = {};

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
 * Home stories first (same order as the reel), then the top story of each
 * category, without repeats.
 */
export function railStories(
  home: readonly ArticleType[],
  byCategory: ArticlesByCategory,
): RailStory[] {
  const picked: RailStory[] = [];
  const seen = new Set<number>();
  const add = (article: ArticleType | undefined) => {
    if (!article || picked.length >= MAX_STORIES) return;
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
  for (const category of config.categories) add(byCategory[category.key][0]);
  return picked;
}

/** The ring shows how outlets are split: left red, centre grey, right blue. */
function ringGradient(bias: RailStory["bias"]) {
  if (bias.totalCount === 0) return "#0084e5";
  const left = bias.leftPercent;
  const center = left + bias.centerPercent;
  return `conic-gradient(#ff5a5f 0 ${left}%, #c8c8c8 ${left}% ${center}%, #2d7eff ${center}% 100%)`;
}

/**
 * Phone-only row of story circles at the top of the home page. The first
 * circle opens the reel; each story opens the reel on that story.
 */
export function UtrinkiRail({ stories }: { stories: RailStory[] }) {
  const [seenRaw] = useLocalStorage<unknown>(UTRINKI_KEYS.seen, EMPTY_SEEN);
  const seen = useMemo(() => sanitizeSeen(seenRaw), [seenRaw]);
  if (stories.length === 0) return null;

  return (
    <nav aria-label="Utrinki" className="col-span-full -mx-3 -mt-1 md:hidden">
      <ul className="flex snap-x scroll-px-3 gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
