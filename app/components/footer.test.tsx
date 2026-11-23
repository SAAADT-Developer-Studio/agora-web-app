import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Footer from "~/components/footer";
import { RenderClockProvider } from "~/components/render-clock";

/**
 * `renderToString` emits the tree React authored. A browser parser would close
 * a `<p>` before a `<div>`, so this has to inspect the raw markup.
 */
function containsDivInsideParagraph(html: string) {
  const paragraphs = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  return paragraphs.some((paragraph) => /<div\b/i.test(paragraph));
}

describe("Footer", () => {
  it("renders no div inside a p", () => {
    const html = renderToString(
      <MemoryRouter>
        <RenderClockProvider renderedAt="2026-11-23T00:00:00.000Z">
          <Footer />
        </RenderClockProvider>
      </MemoryRouter>,
    );

    expect(containsDivInsideParagraph(html)).toBe(false);
    expect(html.replaceAll("<!-- -->", "")).toContain("© 2026 vidik.si");
    expect(html).toContain('<div class="flex items-center gap-2">');
  });
});
