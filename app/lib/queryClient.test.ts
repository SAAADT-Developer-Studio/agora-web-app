import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { getQueryClient, resetQueryClientForTests } from "~/lib/queryClient";

function CategoryHero({ title }: { title: string }) {
  const articles = [{ title }];
  const { data } = useInfiniteQuery({
    queryKey: ["category", "politika"],
    queryFn: async () => ({ articles }),
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    initialData: { pages: [{ articles }], pageParams: [0] },
    staleTime: 3 * 60 * 1000,
  });
  return createElement("h1", null, data.pages[0]?.articles[0]?.title ?? "");
}

function renderHero(client: QueryClient, title: string) {
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(CategoryHero, { title }),
    ),
  );
}

describe("query client per request", () => {
  afterEach(() => {
    resetQueryClientForTests();
    delete (globalThis as { window?: unknown }).window;
  });

  it("does not let one server render reuse another's category cache", () => {
    const first = getQueryClient();
    const second = getQueryClient();
    expect(first).not.toBe(second);
    expect(renderHero(first, "Hidden cluster")).toContain("Hidden cluster");
    expect(renderHero(second, "Fresh cluster")).toContain("Fresh cluster");
  });

  it("shows why a shared client keeps the hidden hero", () => {
    const shared = new QueryClient();
    expect(renderHero(shared, "Hidden cluster")).toContain("Hidden cluster");
    expect(renderHero(shared, "Fresh cluster")).toContain("Hidden cluster");
  });

  it("keeps one client in the browser so hydration can reuse it", () => {
    (globalThis as { window?: unknown }).window = {};
    resetQueryClientForTests();
    const first = getQueryClient();
    const second = getQueryClient();
    expect(first).toBe(second);
    expect(renderHero(first, "Fresh cluster")).toContain("Fresh cluster");
    expect(renderHero(second, "Fresh cluster")).toContain("Fresh cluster");
  });
});
