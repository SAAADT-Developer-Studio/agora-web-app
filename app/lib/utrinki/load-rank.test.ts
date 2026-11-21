import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "~/lib/db";
import { loadUtrinkiPage } from "~/lib/utrinki/load";

vi.mock("~/lib/services/storyRanking", () => ({
  createObservedRankSession: vi.fn(() => ({ failed: false, warned: false })),
  resolveObservedStoryRankRun: vi.fn(),
  getStoryHomeArticles: vi.fn(),
  getStoryCategoryArticles: vi.fn(),
}));

import {
  getStoryCategoryArticles,
  getStoryHomeArticles,
  resolveObservedStoryRankRun,
} from "~/lib/services/storyRanking";

const db = {} as Database;

describe("utrinki story order", () => {
  beforeEach(() => {
    vi.mocked(resolveObservedStoryRankRun).mockReset();
    vi.mocked(getStoryHomeArticles).mockReset();
    vi.mocked(getStoryCategoryArticles).mockReset();
  });

  it("pages the home query through the observed run when the flag is on", async () => {
    vi.mocked(resolveObservedStoryRankRun).mockResolvedValue(9);
    vi.mocked(getStoryHomeArticles).mockResolvedValue([]);

    await loadUtrinkiPage(
      { db, category: "aktualno", page: 2, storyRankOrder: true },
      { hydrate: async () => [] },
    );

    expect(resolveObservedStoryRankRun).toHaveBeenCalledWith(
      db,
      true,
      expect.objectContaining({ failed: false }),
    );
    expect(getStoryHomeArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        db,
        count: 11,
        offset: 20,
        observedRunId: 9,
      }),
    );
    expect(getStoryCategoryArticles).not.toHaveBeenCalled();
  });

  it("uses the category query and skips a run id when the flag is off", async () => {
    vi.mocked(resolveObservedStoryRankRun).mockResolvedValue(undefined);
    vi.mocked(getStoryCategoryArticles).mockResolvedValue([]);

    await loadUtrinkiPage(
      { db, category: "politika", page: 0, storyRankOrder: false },
      { hydrate: async () => [] },
    );

    expect(resolveObservedStoryRankRun).toHaveBeenCalledWith(
      db,
      false,
      expect.anything(),
    );
    expect(getStoryCategoryArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        db,
        category: "politika",
        count: 11,
        offset: 0,
        observedRunId: undefined,
        ignoredClusterIds: [],
      }),
    );
    expect(getStoryHomeArticles).not.toHaveBeenCalled();
  });
});
