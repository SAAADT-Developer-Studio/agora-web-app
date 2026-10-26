import { describe, expect, it } from "vitest";
import {
  UTRINKI_KEYS,
  UTRINKI_MAX_ENTRIES,
  hideStory,
  isDeprioritized,
  orderFeed,
  pruneMap,
  readScroll,
  rememberSeen,
  sanitizeHint,
  sanitizeSaved,
  sanitizeSeen,
  toggleSaved,
  writeScroll,
  type SeenMap,
} from "~/lib/utrinki/store";

const NOW = Date.parse("2026-10-25T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

describe("utrinki local state", () => {
  it("keeps versioned v1 keys", () => {
    expect(UTRINKI_KEYS.seen).toBe("vidik.utrinki.v1.seen");
    expect(UTRINKI_KEYS.hidden).toBe("vidik.utrinki.v1.hidden");
    expect(UTRINKI_KEYS.saved).toBe("vidik.utrinki.v1.saved");
    expect(UTRINKI_KEYS.hint).toBe("vidik.utrinki.v1.hint");
  });

  it("drops malformed and unversioned shapes", () => {
    expect(sanitizeSeen(["nope"])).toEqual({});
    expect(sanitizeSeen({ version: 0, items: [] })).toEqual({});
    expect(
      sanitizeSeen({
        "12": { seenAt: NOW, updatedAt: "2026-10-25T08:00:00.000Z" },
        abc: { seenAt: NOW, updatedAt: "2026-10-25T08:00:00.000Z" },
        "13": { seenAt: "yesterday", updatedAt: "2026-10-25T08:00:00.000Z" },
      }),
    ).toEqual({
      "12": { seenAt: NOW, updatedAt: "2026-10-25T08:00:00.000Z" },
    });
    expect(sanitizeHint({ dismissed: true })).toBeNull();
    expect(sanitizeHint({ dismissedAt: NOW })).toEqual({ dismissedAt: NOW });
    expect(sanitizeSaved({ "4": { savedAt: NOW } })).toEqual({});
  });

  it("prunes old entries and caps the rest, newest first", () => {
    const map: SeenMap = {};
    for (let i = 0; i < UTRINKI_MAX_ENTRIES + 5; i++) {
      map[String(i + 1)] = {
        seenAt: NOW - i * 1000,
        updatedAt: "2026-10-20T00:00:00.000Z",
      };
    }
    map["999999"] = {
      seenAt: NOW - 120 * 24 * HOUR,
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const pruned = pruneMap(map, (entry) => entry.seenAt, NOW);
    expect(pruned["999999"]).toBeUndefined();
    expect(Object.keys(pruned)).toHaveLength(UTRINKI_MAX_ENTRIES);
    expect(pruned["1"]?.seenAt).toBe(NOW);
    expect(pruned[String(UTRINKI_MAX_ENTRIES + 1)]).toBeUndefined();
  });

  it("deprioritises seen stories unless they were updated afterwards", () => {
    const seenAt = "2026-10-25T08:00:00.000Z";
    const seen = rememberSeen({}, 7, seenAt, NOW);
    expect(isDeprioritized(seenAt, seen["7"])).toBe(true);
    expect(isDeprioritized("2026-10-25T07:00:00.000Z", seen["7"])).toBe(true);
    expect(isDeprioritized("2026-10-25T10:00:00.000Z", seen["7"])).toBe(false);
    expect(isDeprioritized(seenAt, undefined)).toBe(false);

    const stories = [
      { id: 1, updatedAt: seenAt },
      { id: 2, updatedAt: "2026-10-25T11:00:00.000Z" },
      { id: 3, updatedAt: "2026-10-24T00:00:00.000Z" },
      { id: 4, updatedAt: seenAt },
    ];
    const seenMap: SeenMap = {
      ...rememberSeen({}, 1, seenAt, NOW - HOUR),
      ...rememberSeen({}, 2, "2026-10-25T09:00:00.000Z", NOW - HOUR),
      ...rememberSeen({}, 4, seenAt, NOW - HOUR),
    };
    const hidden = hideStory({}, 3, NOW);
    expect(
      orderFeed(stories, seenMap, hidden).map((story) => story.id),
    ).toEqual([2, 1, 4]);
  });

  it("toggles a saved snapshot and round-trips the scroll position", () => {
    const saved = toggleSaved(
      {},
      {
        id: 5,
        title: "Naslov",
        imageUrl: null,
        categoryLabel: "POLITIKA",
        updatedAt: "2026-10-25T08:00:00.000Z",
      },
      NOW,
    );
    expect(saved["5"]?.title).toBe("Naslov");
    expect(
      toggleSaved(
        saved,
        {
          id: 5,
          title: "Naslov",
          imageUrl: null,
          categoryLabel: "POLITIKA",
          updatedAt: "2026-10-25T08:00:00.000Z",
        },
        NOW,
      ),
    ).toEqual({});

    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
    };
    writeScroll(storage, { category: "politika", storyId: 5, page: 1 });
    expect(readScroll(storage)).toEqual({
      category: "politika",
      storyId: 5,
      page: 1,
    });
    expect(readScroll({ getItem: () => "nope" })).toBeNull();
  });
});
