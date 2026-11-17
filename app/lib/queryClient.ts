import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

export function createQueryClient() {
  return new QueryClient();
}

/**
 * Each server render gets its own client. A module-level client survives
 * across requests in one isolate, and `useInfiniteQuery` then ignores a
 * newer `initialData` for a category it has already cached.
 * The browser keeps one client so hydration and later navigations share it.
 */
export function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}

export function resetQueryClientForTests() {
  browserQueryClient = undefined;
}
