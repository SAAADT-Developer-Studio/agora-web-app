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
    localStorage.setItem(key, raw);
    snapshots.set(key, { raw, value: newValue });
    window.dispatchEvent(new Event("storage"));
  };
  return [value, setValue] as const;
}
