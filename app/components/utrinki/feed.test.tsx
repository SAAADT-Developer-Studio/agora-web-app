// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  it("keeps older pages reachable when every story is hidden", () => {
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    localStorage.setItem(
      UTRINKI_KEYS.hidden,
      JSON.stringify(
        Object.fromEntries(
          source.stories.map((story) => [String(story.id), { hiddenAt: 1 }]),
        ),
      ),
    );

    renderFeed(source);

    expect(screen.getByRole("button", { name: "Starejši sklopi" })).toBeTruthy();
    expect(screen.queryByText("Ni sklopov")).toBeNull();
    expect(screen.getByText("Vse si pregledal")).toBeTruthy();
  });

  it("uses the empty-category copy when the page has no stories", () => {
    renderFeed(pageOf([], false));

    expect(screen.getByText("Ni sklopov")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Starejši sklopi" })).toBeNull();
  });

  it("moves focus to the restored card CTA after undo", async () => {
    const user = userEvent.setup();
    const source = fixtureUtrinkiPage({ category: "aktualno", page: 0 });
    const story = source.stories[0];
    renderFeed(pageOf([story], false));

    await user.click(screen.getByRole("button", { name: "Meni" }));
    await user.click(screen.getByRole("button", { name: "Skrij" }));
    await user.click(await screen.findByRole("button", { name: "Razveljavi" }));

    await waitFor(() => {
      const cta = [
        ...document.querySelectorAll(`[data-story-id="${story.id}"] a`),
      ].find((link) => link.textContent?.includes("Preberi celoten sklop"));
      expect(document.activeElement).toBe(cta);
    });
  });

  it("does not jump when a later page arrives after a duplicate page", async () => {
    const user = userEvent.setup();
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
    queue[0].resolve(json({ ...pageOf([first, second], true), page: 1 }));
    await screen.findByRole("button", { name: "Starejši sklopi" });

    await user.click(screen.getByRole("button", { name: "Starejši sklopi" }));
    await waitFor(() => expect(queue.map((item) => item.stran)).toEqual(["1", "2"]));
    queue[1].resolve(json({ ...pageOf([first, second], true), page: 2 }));
    await screen.findByRole("button", { name: "Starejši sklopi" });

    jumps.length = 0;
    sessionStorage.setItem(
      UTRINKI_SCROLL_KEY,
      JSON.stringify({
        category: "aktualno",
        storyId: saved.id,
        page: 3,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Meni" }));
    await user.click(screen.getByRole("button", { name: "Skrij" }));
    await waitFor(() => expect(queue.map((item) => item.stran)).toEqual(["1", "2", "3"]));
    queue[2].resolve(
      json({ ...pageOf([extra, saved], false), page: 3 }),
    );

    await waitFor(() => {
      expect(
        document.querySelector(`[data-story-id="${saved.id}"]`),
      ).toBeTruthy();
    });
    // The restored position is the card that remained after Skrij (index 0).
    // A stuck wantMore flag would first jump to the new chunk (index 1).
    expect(jumps).toEqual(["0"]);
  });
});
