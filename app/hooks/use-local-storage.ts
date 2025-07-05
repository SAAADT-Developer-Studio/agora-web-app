import { useSyncExternalStore } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      const data = localStorage.getItem(key);
      console.log("useLocalStorage", key, data);
      return data ? JSON.parse(data) : initialValue;
    },
    () => initialValue,
  );

  const setValue = (newValue: T) => {
    localStorage.setItem(key, JSON.stringify(newValue));
    window.dispatchEvent(new Event("storage"));
  };
  return [value, setValue] as const;
}
