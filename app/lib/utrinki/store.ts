export const UTRINKI_KEYS = {
  seen: "vidik.utrinki.v1.seen",
  hidden: "vidik.utrinki.v1.hidden",
  saved: "vidik.utrinki.v1.saved",
  hint: "vidik.utrinki.v1.hint",
} as const;

export const UTRINKI_SCROLL_KEY = "vidik.utrinki.v1.pos";

/** Drop device state older than this, then cap what remains. */
export const UTRINKI_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const UTRINKI_MAX_ENTRIES = 300;
export const UTRINKI_SAVED_CAP = 100;

export type SeenEntry = { seenAt: number; updatedAt: string };
export type HiddenEntry = { hiddenAt: number };
export type SavedEntry = {
  savedAt: number;
  title: string;
  imageUrl: string | null;
  categoryLabel: string;
  updatedAt: string;
};
export type HintEntry = { dismissedAt: number };

export type SeenMap = Record<string, SeenEntry>;
export type HiddenMap = Record<string, HiddenEntry>;
export type SavedMap = Record<string, SavedEntry>;

export type ScrollState = {
  category: string;
  storyId: number;
  page: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoryKey(key: string) {
  return /^\d+$/.test(key);
}

export function sanitizeSeen(value: unknown): SeenMap {
  if (!isRecord(value)) return {};
  const out: SeenMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isStoryKey(key) || !isRecord(entry)) continue;
    if (typeof entry.seenAt !== "number" || !Number.isFinite(entry.seenAt)) {
      continue;
    }
    if (typeof entry.updatedAt !== "string" || entry.updatedAt.length === 0) {
      continue;
    }
    out[key] = { seenAt: entry.seenAt, updatedAt: entry.updatedAt };
  }
  return out;
}

export function sanitizeHidden(value: unknown): HiddenMap {
  if (!isRecord(value)) return {};
  const out: HiddenMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isStoryKey(key) || !isRecord(entry)) continue;
    if (
      typeof entry.hiddenAt !== "number" ||
      !Number.isFinite(entry.hiddenAt)
    ) {
      continue;
    }
    out[key] = { hiddenAt: entry.hiddenAt };
  }
  return out;
}

export function sanitizeSaved(value: unknown): SavedMap {
  if (!isRecord(value)) return {};
  const out: SavedMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isStoryKey(key) || !isRecord(entry)) continue;
    if (typeof entry.savedAt !== "number" || typeof entry.title !== "string") {
      continue;
    }
    if (typeof entry.updatedAt !== "string") continue;
    out[key] = {
      savedAt: entry.savedAt,
      title: entry.title,
      imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
      categoryLabel:
        typeof entry.categoryLabel === "string" ? entry.categoryLabel : "",
      updatedAt: entry.updatedAt,
    };
  }
  return out;
}

export function sanitizeHint(value: unknown): HintEntry | null {
  if (!isRecord(value) || typeof value.dismissedAt !== "number") return null;
  return { dismissedAt: value.dismissedAt };
}

export function pruneMap<T>(
  map: Record<string, T>,
  timestamp: (value: T) => number,
  now: number,
  limits: { maxAgeMs: number; maxEntries: number } = {
    maxAgeMs: UTRINKI_MAX_AGE_MS,
    maxEntries: UTRINKI_MAX_ENTRIES,
  },
): Record<string, T> {
  const fresh = Object.entries(map).filter(([, value]) => {
    const at = timestamp(value);
    return (
      Number.isFinite(at) && now - at <= limits.maxAgeMs && now >= at - 60_000
    );
  });
  const ranked = fresh
    .slice()
    .sort((a, b) => timestamp(b[1]) - timestamp(a[1]));
  return Object.fromEntries(ranked.slice(0, limits.maxEntries));
}

/** Seen stories sink, unless the story was updated after that viewing. */
export function isDeprioritized(
  updatedAt: string,
  entry: SeenEntry | undefined,
) {
  if (!entry) return false;
  const storyTime = Date.parse(updatedAt);
  const seenVersion = Date.parse(entry.updatedAt);
  if (Number.isNaN(storyTime) || Number.isNaN(seenVersion)) return true;
  return storyTime <= seenVersion;
}

export function orderFeed<T extends { id: number; updatedAt: string }>(
  stories: readonly T[],
  seen: SeenMap,
  hidden: HiddenMap,
): T[] {
  const fresh: T[] = [];
  const stale: T[] = [];
  for (const story of stories) {
    if (hidden[String(story.id)]) continue;
    if (isDeprioritized(story.updatedAt, seen[String(story.id)])) {
      stale.push(story);
    } else {
      fresh.push(story);
    }
  }
  return [...fresh, ...stale];
}

export function rememberSeen(
  map: SeenMap,
  id: number,
  updatedAt: string,
  now: number,
): SeenMap {
  const next = {
    ...map,
    [String(id)]: { seenAt: now, updatedAt },
  };
  return pruneMap(next, (entry) => entry.seenAt, now);
}

export function hideStory(map: HiddenMap, id: number, now: number): HiddenMap {
  return pruneMap(
    { ...map, [String(id)]: { hiddenAt: now } },
    (entry) => entry.hiddenAt,
    now,
  );
}

export function toggleSaved(
  map: SavedMap,
  story: {
    id: number;
    title: string;
    imageUrl: string | null;
    categoryLabel: string;
    updatedAt: string;
  },
  now: number,
): SavedMap {
  const key = String(story.id);
  if (map[key]) {
    const next = { ...map };
    delete next[key];
    return next;
  }
  return pruneMap(
    {
      ...map,
      [key]: {
        savedAt: now,
        title: story.title,
        imageUrl: story.imageUrl,
        categoryLabel: story.categoryLabel,
        updatedAt: story.updatedAt,
      },
    },
    (entry) => entry.savedAt,
    now,
    { maxAgeMs: UTRINKI_MAX_AGE_MS, maxEntries: UTRINKI_SAVED_CAP },
  );
}

export function readScroll(
  storage: Pick<Storage, "getItem">,
): ScrollState | null {
  const raw = storage.getItem(UTRINKI_SCROLL_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (typeof parsed.category !== "string") return null;
    if (typeof parsed.storyId !== "number" || typeof parsed.page !== "number") {
      return null;
    }
    return {
      category: parsed.category,
      storyId: parsed.storyId,
      page: parsed.page,
    };
  } catch {
    return null;
  }
}

export function writeScroll(
  storage: Pick<Storage, "setItem">,
  state: ScrollState,
) {
  storage.setItem(UTRINKI_SCROLL_KEY, JSON.stringify(state));
}
