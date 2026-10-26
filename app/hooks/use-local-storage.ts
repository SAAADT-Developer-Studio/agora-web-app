import { useSyncExternalStore } from "react";

/**
 * Parsed snapshots must stay referentially stable while the stored string
 * does not change. `useSyncExternalStore` re-renders forever if `getSnapshot`
 * returns a fresh object on every call.
 */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function readStored<T>(key: string, initialValue: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }

  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = initialValue;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initialValue;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
      };
    },
    () => readStored(key, initialValue),
    () => initialValue,
  );

  const setValue = (newValue: T) => {
    const raw = JSON.stringify(newValue);
    let stored: string | null = raw;
    try {
      localStorage.setItem(key, raw);
    } catch {
      // Private mode and a full quota throw. Keep the value for this visit
      // and pin the cache to whatever getItem still returns.
      try {
        stored = localStorage.getItem(key);
      } catch {
        stored = null;
      }
    }
    snapshots.set(key, { raw: stored, value: newValue });
    window.dispatchEvent(new Event("storage"));
  };
  return [value, setValue] as const;
}
