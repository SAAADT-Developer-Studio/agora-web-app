import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { StoryCard } from "~/components/utrinki/story-card";
import { SourcesSheet } from "~/components/utrinki/sources-sheet";
import { SavedSheet } from "~/components/utrinki/saved-sheet";
import { EndCard } from "~/components/utrinki/end-card";
import {
  SWIPE_HINT_CYCLE_MS,
  SWIPE_HINT_CYCLES,
  SwipeHint,
} from "~/components/utrinki/swipe-hint";
import { captureReel, dwellBucket } from "~/lib/utrinki/analytics";
import { useUtrinkiStore } from "~/lib/utrinki/use-utrinki-store";
import {
  orderFeed,
  readScroll,
  sanitizeHint,
  UTRINKI_KEYS,
  writeScroll,
  type SavedMap,
} from "~/lib/utrinki/store";
import {
  appendUniqueStories,
  isUtrinkiPage,
  utrinkiDataHref,
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

/** Read straight from storage: the store hook reports defaults until mount. */
function hintAlreadyShown() {
  try {
    const raw = localStorage.getItem(UTRINKI_KEYS.hint);
    return raw !== null && sanitizeHint(JSON.parse(raw)) !== null;
  } catch {
    return false;
  }
}

/** Start loading the next page this many cards before the end. */
const AUTOLOAD_AHEAD = 3;

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<UtrinkiStory[][]>([page.stories]);
  const [hasMore, setHasMore] = useState(page.hasMore);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seenThisVisit, setSeenThisVisit] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [sourcesId, setSourcesId] = useState<number | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const hintChecked = useRef(false);
  const [olderStatus, setOlderStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [orderSeen, setOrderSeen] = useState(store.seen);
  const seenRef = useRef(store.seen);
  seenRef.current = store.seen;
  const loadedPages = useRef(new Set<number>([page.page]));
  const latestPage = useRef(page.page);
  const requestGen = useRef(0);
  const inflightPage = useRef<number | null>(null);
  const wantMore = useRef(false);
  const dwell = useRef<{
    id: number;
    category: string;
    started: number;
  } | null>(null);

  useEffect(() => {
    requestGen.current += 1;
    inflightPage.current = null;
    loadedPages.current = new Set([page.page]);
    latestPage.current = page.page;
    setPages([page.stories]);
    setHasMore(page.hasMore);
    setActiveIndex(0);
    setOlderStatus("idle");
    setSeenThisVisit(new Set());
    setOrderSeen(seenRef.current);
    // A new page (or a new ?zgodba= link) starts at its first card.
    scrollerRef.current?.scrollTo?.({ top: 0 });
  }, [page.category, page.page, page.stories, page.hasMore]);

  useLayoutEffect(() => {
    setOrderSeen((current) => {
      if (Object.keys(current).length > 0) return current;
      return seenRef.current;
    });
  }, [store.seen]);

  const fetchPage = useCallback(
    async (next: number) => {
      if (
        loadedPages.current.has(next) ||
        next < 0 ||
        inflightPage.current !== null
      ) {
        return;
      }
      const generation = requestGen.current;
      inflightPage.current = next;
      setOlderStatus("loading");
      try {
        const response = await fetch(
          utrinkiDataHref(page.category, next, Boolean(page.draft)),
          { headers: { Accept: "application/json" } },
        );
        if (generation !== requestGen.current) return;
        if (!response.ok) throw new Error("utrinki page failed");
        const body: unknown = await response.json();
        if (generation !== requestGen.current) return;
        if (!isUtrinkiPage(body) || body.category !== page.category) {
          throw new Error("utrinki page failed");
        }
        loadedPages.current.add(body.page);
        latestPage.current = body.page;
        setPages((current) => {
          const appended = appendUniqueStories(current, body.stories);
          if (appended === current) wantMore.current = false;
          return appended;
        });
        // The server clamps past its page cap; a different page back means
        // there is nothing further, so stop instead of asking forever.
        setHasMore(body.hasMore && body.page === next);
        setOlderStatus("idle");
      } catch {
        if (generation !== requestGen.current) return;
        wantMore.current = false;
        setOlderStatus("error");
      } finally {
        if (inflightPage.current === next) inflightPage.current = null;
      }
    },
    [page.category, page.draft],
  );

  const hidden = store.hidden;
  const seenForOrder = useMemo(() => {
    const copy = { ...orderSeen };
    for (const id of seenThisVisit) delete copy[String(id)];
    return copy;
  }, [orderSeen, seenThisVisit]);
  const orderedPages = useMemo(
    () =>
      pages.map((chunk, index) => {
        const ordered = orderFeed(chunk, seenForOrder, hidden);
        // A story opened from a link stays first even if seen or hidden.
        const focused =
          index === 0 && page.focus !== undefined
            ? chunk.find((story) => story.id === page.focus)
            : undefined;
        if (!focused) return ordered;
        return [focused, ...ordered.filter((story) => story !== focused)];
      }),
    [pages, seenForOrder, hidden, page.focus],
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
    if (page.focus !== undefined) return;
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
      olderStatus === "idle"
    ) {
      const next = latestPage.current + 1;
      if (next <= saved.page) void fetchPage(next);
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
      if (target?.closest("input, textarea")) return;
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

  // The swipe hint plays once per browser, ever: it is marked as shown the
  // moment it appears, so leaving mid-animation does not bring it back.
  useEffect(() => {
    if (hintChecked.current || visible.length < 2) return undefined;
    hintChecked.current = true;
    if (hintAlreadyShown()) return undefined;
    const show = window.setTimeout(() => {
      store.dismissHint();
      setHintVisible(true);
    }, 700);
    return () => window.clearTimeout(show);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length]);

  useEffect(() => {
    if (!hintVisible) return undefined;
    const hide = () => setHintVisible(false);
    const timer = window.setTimeout(
      hide,
      SWIPE_HINT_CYCLE_MS * SWIPE_HINT_CYCLES + 300,
    );
    // Only real input closes it; programmatic scrolls (restore) must not.
    const events = ["keydown", "pointerdown", "touchstart", "wheel"] as const;
    for (const name of events) {
      window.addEventListener(name, hide, { passive: true });
    }
    return () => {
      window.clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, hide);
    };
  }, [hintVisible]);

  const activeStory = visible[activeIndex] ?? visible.at(-1) ?? null;
  const sourcesStory =
    visible.find((story) => story.id === sourcesId) ??
    (sourcesId === activeStory?.id ? activeStory : null);

  // Load the next page before the reader runs out, so the reel never stops
  // on a button. A failed load waits for the retry button on the end card.
  useEffect(() => {
    if (!hasMore || olderStatus !== "idle") return;
    if (activeIndex < visible.length - AUTOLOAD_AHEAD) return;
    void fetchPage(latestPage.current + 1);
  }, [activeIndex, visible.length, hasMore, olderStatus, fetchPage]);

  function loadOlder() {
    wantMore.current = true;
    void fetchPage(latestPage.current + 1);
  }

  function hideStoryFromFeed(story: UtrinkiStory) {
    store.hide(story.id);
    setSourcesId(null);
    toast("Sklop je skrit.", {
      action: {
        label: "Razveljavi",
        onClick: () => {
          store.unhide(story.id);
          window.setTimeout(() => {
            const card = scrollerRef.current?.querySelector<HTMLElement>(
              `[data-story-id="${story.id}"]`,
            );
            if (!card) return;
            card.scrollIntoView({ block: "start", behavior: "auto" });
            const cta = card.querySelector<HTMLElement>("[data-story-cta]");
            cta?.focus({ preventScroll: true });
          }, 0);
        },
      },
    });
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
    if (saved) {
      toast("Shranjeno.", {
        action: { label: "Shranjeni", onClick: () => openSaved(story) },
      });
    }
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
          hasMore={hasMore}
          loading={olderStatus === "loading"}
          failed={olderStatus === "error"}
          empty={page.stories.length === 0}
          onOlder={loadOlder}
          onFirst={() => scrollToIndex(0)}
        />
      </Shell>
    );
  }

  return (
    <Shell
      backdrop={
        activeIndex < visible.length ? (activeStory?.imageUrl ?? null) : null
      }
      onPrevious={
        activeIndex > 0 ? () => scrollToIndex(activeIndex - 1) : undefined
      }
      onNext={
        activeIndex < visible.length
          ? () => scrollToIndex(activeIndex + 1)
          : undefined
      }
    >
      <h1 className="sr-only">Utrinki</h1>
      <button
        type="button"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-40 focus:rounded-full focus:bg-[#0084e5] focus:px-3 focus:py-2 focus:text-[14px] focus:font-semibold"
        onClick={() => scrollToIndex(Math.min(activeIndex + 1, visible.length))}
      >
        Naslednji sklop
      </button>
      <div
        ref={scrollerRef}
        className={
          reduced
            ? "h-full overflow-y-auto overscroll-y-contain [scrollbar-width:none]"
            : "h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
        aria-label="Utrinki"
        tabIndex={0}
      >
        <p className="sr-only" aria-live="polite">
          {activeStory
            ? `${activeStory.title}. Sklop ${progress.end ? progress.count : progress.index + 1} od ${progress.count}.`
            : "Konec sklopa."}
        </p>
        {visible.map((story, index) => (
          <div
            key={story.id}
            data-feed-index={index}
            data-story-id={story.id}
            className="h-full"
          >
            <StoryCard
              story={story}
              saved={Boolean(store.saved[String(story.id)])}
              near={Math.abs(index - activeIndex) <= 1}
              onOpenSources={() => openSources(story)}
              onToggleSave={() => toggleSave(story)}
              onShare={() => void shareStory(story)}
              onOpenStory={() =>
                captureReel("reel_open_story", { story_id: story.id })
              }
              onHide={() => hideStoryFromFeed(story)}
            />
          </div>
        ))}
        <div data-feed-index={visible.length} className="h-full">
          <EndCard
            hasMore={hasMore}
            loading={olderStatus === "loading"}
            failed={olderStatus === "error"}
            onOlder={loadOlder}
            onFirst={() => scrollToIndex(0)}
          />
        </div>
      </div>
      {hintVisible && <SwipeHint reduced={reduced} />}
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

/**
 * Fills the space under the site header in the header's own colours. On
 * desktop the reel is a column over a blurred copy of the current photo,
 * with up/down buttons beside it.
 */
function Shell({
  children,
  backdrop = null,
  onPrevious,
  onNext,
}: {
  children: ReactNode;
  /** Photo of the story on screen; desktop only. */
  backdrop?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="bg-surface text-surface-text relative min-h-0 flex-1 overflow-hidden [font-family:'Source_Sans_3','Source_Sans_Pro',Inter,system-ui,sans-serif] md:bg-[#111]">
      {backdrop && (
        <img
          key={backdrop}
          src={backdrop}
          alt=""
          aria-hidden
          className="motion-safe:animate-in motion-safe:fade-in pointer-events-none absolute -top-16 -left-16 hidden h-[calc(100%+8rem)] w-[calc(100%+8rem)] max-w-none object-cover blur-[60px] brightness-[0.55] saturate-[1.3] motion-safe:duration-500 md:block"
        />
      )}
      <div className="md:bg-surface relative mx-auto h-full w-full max-w-[430px] md:shadow-[0_0_60px_rgba(0,0,0,0.4)]">
        {children}
      </div>
      {(onPrevious || onNext) && (
        <div className="absolute top-1/2 left-[calc(50%+235px)] hidden -translate-y-1/2 flex-col gap-3 md:flex">
          <ReelArrow label="Prejšnji sklop" onClick={onPrevious}>
            <ChevronUp className="size-6" aria-hidden />
          </ReelArrow>
          <ReelArrow label="Naslednji sklop" onClick={onNext}>
            <ChevronDown className="size-6" aria-hidden />
          </ReelArrow>
        </div>
      )}
    </div>
  );
}

function ReelArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={!onClick}
      className="grid size-12 place-items-center rounded-full bg-white/90 text-[#222] shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

export type { UtrinkiCategory };
