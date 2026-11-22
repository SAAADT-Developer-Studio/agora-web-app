import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppLoadContext } from "~/lib/appContext";
import type { Database } from "~/lib/db";
import { readUtrinkiPage } from "~/lib/utrinki/readPage";

vi.mock("~/lib/utrinki/load", () => ({
  hydrateUtrinkiStories: vi.fn(async () => []),
  loadUtrinkiPage: vi.fn(async () => ({
    stories: [],
    page: 0,
    pageSize: 10,
    hasMore: false,
    category: "aktualno",
  })),
}));

import { loadUtrinkiPage } from "~/lib/utrinki/load";

function contextFor(storyRankOrder: string | undefined) {
  const keys: string[] = [];
  const context = createAppLoadContext({
    cloudflare: {
      env: { STORY_RANK_ORDER: storyRankOrder } as Env,
      ctx: {} as ExecutionContext,
    },
    db: {} as Database,
    kvCache: {
      cached: async (
        load: () => Promise<unknown>,
        options: { key: string },
      ) => {
        keys.push(options.key);
        return load();
      },
      get: async () => null,
    } as never,
    measurer: {
      time: async (_name: string, run: () => Promise<unknown>) => run(),
    } as never,
  });
  return { context, keys };
}

describe("utrinki page cache", () => {
  beforeEach(() => {
    vi.mocked(loadUtrinkiPage).mockClear();
  });

  it("uses the observed-rank key when STORY_RANK_ORDER is on", async () => {
    const { context, keys } = contextFor("true");
    await readUtrinkiPage(
      new Request("https://vidik.si/utrinki?kategorija=politika&stran=2"),
      context,
    );
    expect(keys).toEqual(["data:story:utrinki:v2:politika:2:observed-rank"]);
    expect(loadUtrinkiPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "politika",
        page: 2,
        storyRankOrder: true,
      }),
    );
  });

  it("keeps the formula key when the flag is off", async () => {
    const { context, keys } = contextFor("false");
    await readUtrinkiPage(new Request("https://vidik.si/utrinki"), context);
    expect(keys).toEqual(["data:story:utrinki:v2:aktualno:0"]);
    expect(loadUtrinkiPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "aktualno",
        page: 0,
        storyRankOrder: false,
      }),
    );
  });
});
