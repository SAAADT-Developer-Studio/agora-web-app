import { useEffect, useMemo, useRef } from "react";
import { useLocalStorage } from "~/hooks/use-local-storage";
import {
  UTRINKI_KEYS,
  hideStory,
  pruneMap,
  rememberSeen,
  unhideStory,
  sanitizeHidden,
  sanitizeHint,
  sanitizeSaved,
  sanitizeSeen,
  toggleSaved,
  type HiddenMap,
  type SavedMap,
  type SeenMap,
} from "~/lib/utrinki/store";

const EMPTY_SEEN: SeenMap = {};
const EMPTY_HIDDEN: HiddenMap = {};
const EMPTY_SAVED: SavedMap = {};

export function useUtrinkiStore() {
  const [seenRaw, setSeenRaw] = useLocalStorage<unknown>(
    UTRINKI_KEYS.seen,
    EMPTY_SEEN,
  );
  const [hiddenRaw, setHiddenRaw] = useLocalStorage<unknown>(
    UTRINKI_KEYS.hidden,
    EMPTY_HIDDEN,
  );
  const [savedRaw, setSavedRaw] = useLocalStorage<unknown>(
    UTRINKI_KEYS.saved,
    EMPTY_SAVED,
  );
  const [hintRaw, setHintRaw] = useLocalStorage<unknown>(
    UTRINKI_KEYS.hint,
    null,
  );

  const seen = useMemo(() => sanitizeSeen(seenRaw), [seenRaw]);
  const hidden = useMemo(() => sanitizeHidden(hiddenRaw), [hiddenRaw]);
  const saved = useMemo(() => sanitizeSaved(savedRaw), [savedRaw]);
  const hintDismissed = useMemo(
    () => sanitizeHint(hintRaw) !== null,
    [hintRaw],
  );

  const seenRef = useRef(seen);
  const hiddenRef = useRef(hidden);
  const savedRef = useRef(saved);
  seenRef.current = seen;
  hiddenRef.current = hidden;
  savedRef.current = saved;

  const pruned = useRef(false);
  useEffect(() => {
    if (pruned.current) return;
    pruned.current = true;
    const now = Date.now();
    const nextSeen = pruneMap(seen, (entry) => entry.seenAt, now);
    const nextHidden = pruneMap(hidden, (entry) => entry.hiddenAt, now);
    const nextSaved = pruneMap(saved, (entry) => entry.savedAt, now);
    if (JSON.stringify(nextSeen) !== JSON.stringify(seenRaw))
      setSeenRaw(nextSeen);
    if (JSON.stringify(nextHidden) !== JSON.stringify(hiddenRaw)) {
      setHiddenRaw(nextHidden);
    }
    if (JSON.stringify(nextSaved) !== JSON.stringify(savedRaw))
      setSavedRaw(nextSaved);
  }, [
    hidden,
    hiddenRaw,
    saved,
    savedRaw,
    seen,
    seenRaw,
    setHiddenRaw,
    setSavedRaw,
    setSeenRaw,
  ]);

  return {
    seen,
    hidden,
    saved,
    hintDismissed,
    remember(id: number, updatedAt: string) {
      const next = rememberSeen(seenRef.current, id, updatedAt, Date.now());
      seenRef.current = next;
      setSeenRaw(next);
    },
    hide(id: number) {
      const next = hideStory(hiddenRef.current, id, Date.now());
      hiddenRef.current = next;
      setHiddenRaw(next);
    },
    unhide(id: number) {
      const next = unhideStory(hiddenRef.current, id);
      hiddenRef.current = next;
      setHiddenRaw(next);
    },
    toggleSave(story: {
      id: number;
      title: string;
      imageUrl: string | null;
      categoryLabel: string;
      updatedAt: string;
    }) {
      const next = toggleSaved(savedRef.current, story, Date.now());
      savedRef.current = next;
      setSavedRaw(next);
      return Boolean(next[String(story.id)]);
    },
    dismissHint() {
      setHintRaw({ dismissedAt: Date.now() });
    },
  };
}
