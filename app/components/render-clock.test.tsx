// @vitest-environment happy-dom
import { act, type ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { RelativeTime, RenderClockProvider } from "~/components/render-clock";

afterEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

function hydrate(html: string, element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  container.innerHTML = html;
  const errors: unknown[] = [];
  let root: Root | undefined;
  act(() => {
    root = hydrateRoot(container, element, {
      onRecoverableError(error) {
        errors.push(error);
      },
    });
  });
  if (!root) throw new Error("hydrateRoot did not return a root");
  return { container, errors, root };
}

function ThemeProbe() {
  const [theme] = useLocalStorage("theme", "light");
  return <span>{theme}</span>;
}

describe("hydration", () => {
  it("paints relative time from the server clock", () => {
    const renderedAt = "2026-11-21T12:05:10.000Z";
    const element = (
      <RenderClockProvider renderedAt={renderedAt}>
        <RelativeTime date="2026-11-21T12:00:00.000Z" />
      </RenderClockProvider>
    );
    const html = renderToString(element);
    expect(html).toContain("pred 5 minutami");

    const { container, errors, root } = hydrate(html, element);
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("pred");
    act(() => {
      root.unmount();
    });
  });

  it("keeps a stored theme out of the server HTML", () => {
    localStorage.setItem("theme", JSON.stringify("dark"));

    const element = <ThemeProbe />;
    const html = renderToString(element);
    expect(html).toContain("light");
    expect(html).not.toContain("dark");

    const { container, errors, root } = hydrate(html, element);
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("dark");
    act(() => {
      root.unmount();
    });
  });
});
