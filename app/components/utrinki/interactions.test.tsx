// @vitest-environment happy-dom
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ReelChrome } from "~/components/utrinki/chrome";
import { SourcesSheet } from "~/components/utrinki/sources-sheet";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { fixtureUtrinkiPage } from "~/lib/utrinki/fixtures";
import type { UtrinkiStory } from "~/lib/utrinki/model";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function withRouter(node: ReactNode) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

const base = fixtureUtrinkiPage({ category: "aktualno", page: 0 }).stories[0];

function storyWith(count: number, left = 11): UtrinkiStory {
  return {
    ...base,
    articles: base.articles.slice(0, count),
    bias: { ...base.bias, left },
  };
}

describe("utrinki menu", () => {
  it("traps focus, closes on Escape, and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    render(withRouter(<ReelChrome category="politika" onHide={onHide} />));

    const menu = screen.getByRole("button", { name: "Meni" });
    await user.click(menu);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByText("Izbrana kategorija: POLITIKA")).toBeTruthy();

    const hide = screen.getByRole("button", { name: "Skrij" });
    expect(hide.tabIndex).not.toBe(-1);
    hide.focus();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    hide.focus();
    await user.keyboard("{Enter}");
    expect(onHide).toHaveBeenCalledOnce();

    await user.click(menu);
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(menu);
  });
});

describe("utrinki sources sheet", () => {
  it("resets the filter when the sheet is swiped closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      withRouter(
        <SourcesSheet
          story={storyWith(6, 0)}
          onClose={onClose}
          onOpenStory={() => undefined}
        />,
      ),
    );

    const dialog = screen.getByRole("dialog");
    const left = screen.getByRole("button", { name: "Levo 0" });
    expect((left as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "+ 2 članka" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Center 5" }));
    expect(
      screen.getByRole("button", { name: "Center 5" }).getAttribute("aria-pressed"),
    ).toBe("true");

    const handle = dialog.querySelector("[data-sheet-handle]");
    await act(async () => {
      handle?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, clientY: 40 }),
      );
      window.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, clientY: 160 }),
      );
    });

    expect(onClose).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Vsi 24" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Center 5" }).getAttribute("aria-pressed"),
    ).toBe("false");

    screen.getByRole("button", { name: "Zapri" }).focus();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("pluralises the hidden-article control", () => {
    const cases: [number, string][] = [
      [5, "+ 1 članek"],
      [7, "+ 3 članki"],
      [8, "+ 4 članki"],
      [9, "+ 5 člankov"],
    ];
    for (const [count, label] of cases) {
      cleanup();
      render(
        withRouter(
          <SourcesSheet
            story={storyWith(count)}
            onClose={() => undefined}
            onOpenStory={() => undefined}
          />,
        ),
      );
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });
});

function StorageProbe() {
  const [value, setValue] = useLocalStorage("probe-quota", "a");
  return (
    <button type="button" onClick={() => setValue("b")}>
      {value}
    </button>
  );
}

describe("useLocalStorage quota", () => {
  it("keeps the in-memory value when setItem throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    render(<StorageProbe />);
    await user.click(screen.getByRole("button", { name: "a" }));
    expect(screen.getByRole("button", { name: "b" })).toBeTruthy();
  });
});
