// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Toaster } from "sonner";
import { UtrinkiFeed } from "~/components/utrinki/feed";
import { fixtureUtrinkiPage } from "~/lib/utrinki/fixtures";
import { UTRINKI_KEYS, UTRINKI_SCROLL_KEY } from "~/lib/utrinki/store";
import type { UtrinkiPage, UtrinkiStory } from "~/lib/utrinki/model";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigation: () => ({ state: "idle", location: undefined }),
  };
});

const jumps: string[] = [];

beforeEach(() => {
  jumps.length = 0;
  localStorage.clear();
  sessionStorage.clear();
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
    jumps.push(
      this.getAttribute("data-feed-index") ??
        this.getAttribute("data-story-id") ??
        "",
    );
  };
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
      }) satisfies MediaQueryList,
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderFeed(page: UtrinkiPage) {
  return render(
    <MemoryRouter>
      <Toaster />
      <UtrinkiFeed page={page} />
    </MemoryRouter>,
  );
}

function pageOf(stories: UtrinkiStory[], hasMore: boolean): UtrinkiPage {
  const base = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
  return { ...base, stories, hasMore, page: 0 };
}

function json(page: UtrinkiPage) {
  return new Response(JSON.stringify(page), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("utrinki feed", () => {
  it("loads older pages on its own when every story is hidden", async () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    localStorage.setItem(
      UTRINKI_KEYS.hidden,
      JSON.stringify(
        Object.fromEntries(
          source.stories.map((story) => [String(story.id), { hiddenAt: 1 }]),
        ),
      ),
    );
    const older = { ...source.stories[0], id: 555, title: "Starejša zgodba" };
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      requested.push(String(input));
      return json({ ...pageOf([older], false), page: 1 });
    });

    renderFeed({ ...source, hasMore: true });

    expect(screen.getByText("Nalagam nove sklope …")).toBeTruthy();
    expect(await screen.findByText("Starejša zgodba")).toBeTruthy();
    expect(requested).toEqual(["/api/utrinki?stran=1"]);
    expect(
      screen.queryByRole("button", { name: "Starejši sklopi" }),
    ).toBeNull();
  });

  it("offers a retry when the next page fails", async () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    vi.stubGlobal("fetch", async () => new Response("", { status: 500 }));

    renderFeed(pageOf([source.stories[0]], true));

    expect(
      await screen.findByRole("button", { name: "Poskusi znova" }),
    ).toBeTruthy();
    expect(screen.getByText("Nalaganje ni uspelo")).toBeTruthy();
  });

  it("uses the empty-category copy when the page has no stories", () => {
    renderFeed(pageOf([], false));

    expect(screen.getByText("Ni sklopov")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Starejši sklopi" }),
    ).toBeNull();
  });

  it("moves focus to the restored card CTA after undo", async () => {
    const user = userEvent.setup();
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    const story = source.stories[0];
    renderFeed(pageOf([story], false));

    await user.click(screen.getByRole("button", { name: "Skrij sklop" }));
    await user.click(await screen.findByRole("button", { name: "Razveljavi" }));

    await waitFor(() => {
      const cta = document.querySelector(
        `[data-story-id="${story.id}"] [data-story-cta]`,
      );
      expect(cta).toBeTruthy();
      expect(document.activeElement).toBe(cta);
    });
  });

  it("keeps loading past duplicate pages and restores without a jump", async () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    const [first, second, , , , saved, extra] = source.stories;
    sessionStorage.setItem(
      UTRINKI_SCROLL_KEY,
      JSON.stringify({
        category: "aktualno",
        storyId: saved.id,
        page: 3,
      }),
    );
    const queue: { stran: string; resolve: (response: Response) => void }[] =
      [];
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const stran =
        new URL(url, "http://localhost").searchParams.get("stran") ?? "";
      return new Promise<Response>((resolve) => {
        queue.push({ stran, resolve });
      });
    });

    renderFeed(pageOf([first, second], true));
    await waitFor(() => expect(queue.map((item) => item.stran)).toEqual(["1"]));
    // Pages 1 and 2 only repeat stories already on the reel.
    queue[0].resolve(json({ ...pageOf([first, second], true), page: 1 }));
    await waitFor(() =>
      expect(queue.map((item) => item.stran)).toEqual(["1", "2"]),
    );
    queue[1].resolve(json({ ...pageOf([first, second], true), page: 2 }));
    await waitFor(() =>
      expect(queue.map((item) => item.stran)).toEqual(["1", "2", "3"]),
    );

    jumps.length = 0;
    // The reel records its own position on mount; put the target back.
    sessionStorage.setItem(
      UTRINKI_SCROLL_KEY,
      JSON.stringify({ category: "aktualno", storyId: saved.id, page: 3 }),
    );
    queue[2].resolve(json({ ...pageOf([extra, saved], false), page: 3 }));

    await waitFor(() => {
      expect(
        document.querySelector(`[data-story-id="${saved.id}"]`),
      ).toBeTruthy();
    });
    // Only the scroll restore moves the reel, straight to the saved story.
    const savedIndex = document
      .querySelector(`[data-story-id="${saved.id}"]`)
      ?.getAttribute("data-feed-index");
    expect(jumps).toEqual([savedIndex]);
  });

  it("stops asking when the server returns a different page", async () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      requested.push(String(input));
      // Past the cap the server answers with its last page again.
      return json({ ...pageOf([source.stories[1]], true), page: 0 });
    });

    renderFeed(pageOf([source.stories[0]], true));

    expect(await screen.findByText("Vse si pregledal")).toBeTruthy();
    expect(requested).toHaveLength(1);
  });

  it("shows the swipe hint once per browser, ever", async () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    renderFeed(source);

    expect(
      await screen.findByText("Povleci navzgor", {}, { timeout: 2000 }),
    ).toBeTruthy();
    expect(localStorage.getItem(UTRINKI_KEYS.hint)).not.toBeNull();

    cleanup();
    renderFeed(source);
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(screen.queryByText("Povleci navzgor")).toBeNull();
  });

  it("keeps a story opened from a link first, even when already seen", () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    const focus = source.stories[0];
    localStorage.setItem(
      UTRINKI_KEYS.seen,
      JSON.stringify({
        [String(focus.id)]: { seenAt: Date.now(), updatedAt: focus.updatedAt },
      }),
    );

    renderFeed({ ...source, focus: focus.id });

    const first = document.querySelector("[data-feed-index='0']");
    expect(first?.getAttribute("data-story-id")).toBe(String(focus.id));
  });
});
