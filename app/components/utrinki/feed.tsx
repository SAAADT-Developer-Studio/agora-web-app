import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronUp } from "lucide-react";
import { useFetcher, useNavigation } from "react-router";
import { toast } from "sonner";
import { StoryCard } from "~/components/utrinki/story-card";
import { SourcesSheet } from "~/components/utrinki/sources-sheet";
import { SavedSheet } from "~/components/utrinki/saved-sheet";
import { EndCard } from "~/components/utrinki/end-card";
import { captureReel, dwellBucket } from "~/lib/utrinki/analytics";
import { useUtrinkiStore } from "~/lib/utrinki/use-utrinki-store";
import {
  orderFeed,
  readScroll,
  writeScroll,
  type SavedMap,
} from "~/lib/utrinki/store";
import {
  parseUtrinkiQuery,
  utrinkiPageHref,
  type UtrinkiCategory,
  type UtrinkiPage,
  type UtrinkiStory,
} from "~/lib/utrinki/model";

async function shareStory(story: UtrinkiStory) {
  captureReel("reel_share", { story_id: story.id });
  const url = new URL(story.storyPath, window.location.origin).href;
  if (navigator.share) {
    try {
      await navigator.share({ title: story.title, text: story.title, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Povezava je kopirana.");
  } catch {
    toast.error("Povezave ni bilo mogoče kopirati.");
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function UtrinkiFeed({ page }: { page: UtrinkiPage }) {
  const store = useUtrinkiStore();
  const reduced = usePrefersReducedMotion();
  const navigation = useNavigation();
  const fetcher = useFetcher<UtrinkiPage>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<UtrinkiStory[][]>([page.stories]);
  const [hasMore, setHasMore] = useState(page.hasMore);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seenThisVisit, setSeenThisVisit] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [sourcesId, setSourcesId] = useState<number | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [orderSeen, setOrderSeen] = useState(store.seen);
  const seenRef = useRef(store.seen);
  seenRef.current = store.seen;
  const loadedPages = useRef(new Set<number>([page.page]));
  const wantMore = useRef(false);
  const dwell = useRef<{
    id: number;
    category: string;
    started: number;
  } | null>(null);

  const pendingCategory = useMemo(() => {
    if (navigation.state === "idle" || !navigation.location) return null;
    return parseUtrinkiQuery(new URLSearchParams(navigation.location.search))
      .category;
  }, [navigation.location, navigation.state]);

  useEffect(() => {
    loadedPages.current = new Set([page.page]);
    setPages([page.stories]);
    setHasMore(page.hasMore);
    setActiveIndex(0);
    setSeenThisVisit(new Set());
    setOrderSeen(seenRef.current);
  }, [page.category, page.page, page.stories, page.hasMore]);

  useLayoutEffect(() => {
    setOrderSeen((current) => {
      if (Object.keys(current).length > 0) return current;
      return seenRef.current;
    });
  }, [store.seen]);

  useEffect(() => {
    const data = fetcher.data;
    if (!data || data.category !== page.category) return;
    if (loadedPages.current.has(data.page)) return;
    loadedPages.current.add(data.page);
    setPages((current) => [...current, data.stories]);
    setHasMore(data.hasMore);
  }, [fetcher.data, page.category]);

  const hidden = store.hidden;
  const seenForOrder = useMemo(() => {
    const copy = { ...orderSeen };
    for (const id of seenThisVisit) delete copy[String(id)];
    return copy;
  }, [orderSeen, seenThisVisit]);
  const orderedPages = useMemo(
    () => pages.map((chunk) => orderFeed(chunk, seenForOrder, hidden)),
    [pages, seenForOrder, hidden],
  );
  const visible = useMemo(() => orderedPages.flat(), [orderedPages]);

  const progress = useMemo(() => {
    let cursor = 0;
    for (const chunk of orderedPages) {
      if (chunk.length === 0) continue;
      if (activeIndex < cursor + chunk.length) {
        return { index: activeIndex - cursor, count: chunk.length, end: false };
      }
      cursor += chunk.length;
    }
    const last = orderedPages
      .slice()
      .reverse()
      .find((chunk) => chunk.length > 0);
    return { index: 0, count: last?.length || 1, end: true };
  }, [activeIndex, orderedPages]);

  const scrollToIndex = useCallback(
    (index: number, behavior?: ScrollBehavior) => {
      const root = scrollerRef.current;
      const target = root?.querySelector<HTMLElement>(
        `[data-feed-index="${index}"]`,
      );
      target?.scrollIntoView({
        block: "start",
        behavior: behavior ?? (reduced ? "auto" : "smooth"),
      });
    },
    [reduced],
  );

  useEffect(() => {
    if (!wantMore.current) return;
    wantMore.current = false;
    const previous = pages.slice(0, -1);
    const index = previous.reduce(
      (sum, chunk) => sum + orderFeed(chunk, seenForOrder, hidden).length,
      0,
    );
    scrollToIndex(index);
    // Scroll once when a requested page arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55,
          )
          .slice()
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best || !(best.target instanceof HTMLElement)) return;
        const index = Number(best.target.dataset.feedIndex);
        if (Number.isInteger(index)) setActiveIndex(index);
      },
      { root, threshold: [0.55, 0.8] },
    );
    for (const node of root.querySelectorAll("[data-feed-index]")) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [visible.length, hasMore]);

  useEffect(() => {
    const saved = readScroll(sessionStorage);
    if (!saved || saved.category !== page.category) return;
    const index = visible.findIndex((story) => story.id === saved.storyId);
    if (index >= 0) {
      scrollToIndex(index, "auto");
      return;
    }
    if (
      saved.page > page.page &&
      saved.page < page.page + 4 &&
      hasMore &&
      fetcher.state === "idle"
    ) {
      const next = page.page + pages.length;
      if (next <= saved.page) {
        void fetcher.load(
          utrinkiPageHref(page.category, next, Boolean(page.draft)),
        );
      }
    }
    // Restore once per loaded set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((story) => story.id).join(","), page.category]);

  const flushDwell = () => {
    const current = dwell.current;
    if (!current) return;
    captureReel("reel_view", {
      story_id: current.id,
      dwell_bucket: dwellBucket(Date.now() - current.started),
      category: current.category,
    });
    dwell.current = null;
  };

  useEffect(() => {
    const story = visible[activeIndex];
    if (!story) {
      flushDwell();
      return undefined;
    }
    if (dwell.current?.id !== story.id) {
      const hadPrevious = dwell.current !== null;
      flushDwell();
      if (hadPrevious) navigator.vibrate?.(10);
      dwell.current = {
        id: story.id,
        category: page.category,
        started: Date.now(),
      };
    }
    const seenTimer = window.setTimeout(() => {
      setSeenThisVisit((current) => {
        if (current.has(story.id)) return current;
        const next = new Set(current);
        next.add(story.id);
        return next;
      });
      store.remember(story.id, story.updatedAt);
    }, 1500);
    const chunkPage = Math.min(
      page.page + Math.floor(activeIndex / Math.max(progress.count, 1)),
      page.page + pages.length - 1,
    );
    writeScroll(sessionStorage, {
      category: page.category,
      storyId: story.id,
      page: chunkPage,
    });
    if (activeIndex > 0 && !store.hintDismissed) store.dismissHint();
    return () => window.clearTimeout(seenTimer);
    // remember/dismiss identity changes every render; the index is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, visible, page.category]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushDwell();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flushDwell();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("[data-chip-rail], input, textarea")) return;
      if (sourcesId !== null || savedOpen) return;
      const last = visible.length;
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "j"
      ) {
        event.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, last));
      } else if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "k"
      ) {
        event.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      } else if (event.key === "Home") {
        event.preventDefault();
        scrollToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        scrollToIndex(last);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeIndex,
    reduced,
    savedOpen,
    scrollToIndex,
    sourcesId,
    visible.length,
  ]);

  const activeStory = visible[activeIndex] ?? visible.at(-1) ?? null;
  const sourcesStory =
    visible.find((story) => story.id === sourcesId) ??
    (sourcesId === activeStory?.id ? activeStory : null);

  function loadOlder() {
    const next = page.page + pages.length;
    wantMore.current = true;
    void fetcher.load(
      utrinkiPageHref(page.category, next, Boolean(page.draft)),
    );
  }

  function toggleSave(story: UtrinkiStory) {
    const saved = store.toggleSave({
      id: story.id,
      title: story.title,
      imageUrl: story.imageUrl,
      categoryLabel: story.categoryLabel,
      updatedAt: story.updatedAt,
    });
    captureReel("reel_save", { story_id: story.id, saved });
  }

  function openSources(story: UtrinkiStory) {
    setSourcesId(story.id);
    captureReel("reel_sheet_open", {
      story_id: story.id,
      sheet: "kako-porocajo",
    });
  }

  function openSaved(story?: UtrinkiStory) {
    setSavedOpen(true);
    if (story) {
      captureReel("reel_sheet_open", {
        story_id: story.id,
        sheet: "shranjeni",
      });
    }
  }

  if (visible.length === 0) {
    return (
      <Shell>
        <EndCard
          category={page.category}
          pendingCategory={pendingCategory}
          draft={page.draft}
          progressCount={1}
          imageUrl={null}
          hasMore={hasMore}
          loading={fetcher.state !== "idle"}
          onOlder={loadOlder}
          onFirst={() => scrollToIndex(0)}
        />
      </Shell>
    );
  }

  const showHint =
    !store.hintDismissed && activeIndex === 0 && visible.length > 0;

  return (
    <Shell>
      <h1 className="sr-only">Utrinki</h1>
      <button
        type="button"
        className="sr-only focus:not-sr-only focus:absolute focus:top-[4.5rem] focus:left-4 focus:z-30 focus:rounded-full focus:bg-[#0084e5] focus:px-3 focus:py-2 focus:text-[14px] focus:font-semibold"
        onClick={() => scrollToIndex(Math.min(activeIndex + 1, visible.length))}
      >
        Naslednji sklop
      </button>
      <div
        ref={scrollerRef}
        className={
          reduced
            ? "h-dvh overflow-y-auto overscroll-y-contain [scrollbar-width:none]"
            : "h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
        aria-label="Utrinki"
        tabIndex={0}
      >
        <p className="sr-only" aria-live="polite">
          {activeStory
            ? `${activeStory.title}. Sklop ${progress.end ? progress.count : progress.index + 1} od ${progress.count}.`
            : "Konec sklopa."}
        </p>
        {visible.map((story, index) => {
          let cursor = 0;
          let localIndex = 0;
          let localCount = progress.count;
          for (const chunk of orderedPages) {
            if (index < cursor + chunk.length) {
              localIndex = index - cursor;
              localCount = chunk.length;
              break;
            }
            cursor += chunk.length;
          }
          return (
            <div key={story.id} data-feed-index={index}>
              <StoryCard
                story={story}
                category={page.category}
                pendingCategory={pendingCategory}
                draft={page.draft}
                progressIndex={localIndex}
                progressCount={localCount}
                saved={Boolean(store.saved[String(story.id)])}
                onOpenSources={() => openSources(story)}
                onOpenSaved={() => openSaved(story)}
                onToggleSave={() => toggleSave(story)}
                onShare={() => void shareStory(story)}
                onOpenStory={() =>
                  captureReel("reel_open_story", { story_id: story.id })
                }
                onHide={() => {
                  store.hide(story.id);
                  setSourcesId(null);
                }}
              />
            </div>
          );
        })}
        <div data-feed-index={visible.length}>
          <EndCard
            category={page.category}
            pendingCategory={pendingCategory}
            draft={page.draft}
            progressCount={
              progress.end
                ? progress.count
                : orderedPages.at(-1)?.length || progress.count
            }
            imageUrl={visible.at(-1)?.imageUrl ?? null}
            hasMore={hasMore}
            loading={fetcher.state !== "idle"}
            onOlder={loadOlder}
            onFirst={() => scrollToIndex(0)}
          />
        </div>
      </div>
      {showHint && (
        <div className="pointer-events-none absolute inset-x-0 top-[30%] z-30 flex justify-center px-6">
          <div className="pointer-events-auto flex max-w-[320px] items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[13px] font-semibold text-[#f3f8fe] ring-1 ring-white/20">
            <ChevronUp
              size={16}
              className={reduced ? undefined : "motion-safe:animate-bounce"}
              aria-hidden
            />
            <span>
              {reduced
                ? "Za naslednji sklop pritisni puščico navzdol."
                : "Povleci navzgor za naslednji sklop."}
            </span>
            <button
              type="button"
              onClick={() => store.dismissHint()}
              className="rounded-full px-2 py-1 text-[12px] text-[#0084e5]"
            >
              V redu
            </button>
          </div>
        </div>
      )}
      <SourcesSheet
        story={sourcesId === null ? null : sourcesStory}
        onClose={() => setSourcesId(null)}
        onOpenStory={() => {
          if (sourcesStory) {
            captureReel("reel_open_story", { story_id: sourcesStory.id });
          }
        }}
      />
      <SavedSheet
        open={savedOpen}
        saved={store.saved}
        onClose={() => setSavedOpen(false)}
        onUnsave={(id) => unsave(store.saved, id, store.toggleSave)}
        onOpen={(id) => captureReel("reel_open_story", { story_id: id })}
      />
    </Shell>
  );
}

function unsave(
  saved: SavedMap,
  id: number,
  toggle: (story: {
    id: number;
    title: string;
    imageUrl: string | null;
    categoryLabel: string;
    updatedAt: string;
  }) => boolean,
) {
  const entry = saved[String(id)];
  if (!entry) return;
  toggle({
    id,
    title: entry.title,
    imageUrl: entry.imageUrl,
    categoryLabel: entry.categoryLabel,
    updatedAt: entry.updatedAt,
  });
  captureReel("reel_save", { story_id: id, saved: false });
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-[#111318] [font-family:'Source_Sans_3','Source_Sans_Pro',Inter,system-ui,sans-serif] text-[#f3f8fe]">
      <div className="relative mx-auto h-dvh w-full max-w-[390px] md:shadow-[0_18px_36px_rgba(10,15,23,0.35)]">
        {children}
      </div>
    </div>
  );
}

export type { UtrinkiCategory };
