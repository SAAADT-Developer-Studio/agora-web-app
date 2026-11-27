// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { StoryCard } from "~/components/utrinki/story-card";
import { fixtureUtrinkiPage } from "~/lib/utrinki/fixtures";
import type { UtrinkiStory } from "~/lib/utrinki/model";

afterEach(() => {
  cleanup();
});

const base = fixtureUtrinkiPage({ category: "aktualno", page: 0 }).stories[0];

function renderCard(story: UtrinkiStory) {
  return render(
    <MemoryRouter>
      <StoryCard
        story={story}
        saved={false}
        onOpenSources={() => undefined}
        onToggleSave={() => undefined}
        onShare={() => undefined}
        onOpenStory={() => undefined}
        onHide={() => undefined}
      />
    </MemoryRouter>,
  );
}

describe("utrinki story card", () => {
  it("capitalizes the story title the same way as the story page", () => {
    renderCard({ ...base, title: "mala začetnica v naslovu" });

    const heading = screen.getByRole("heading", {
      name: "mala začetnica v naslovu",
    });
    expect(heading.className).toContain("first-letter:uppercase");
    expect(heading.className).not.toContain("capitalize");
  });

  it("exposes one slide control per article image", () => {
    renderCard({
      ...base,
      imageUrl: "https://img.test/a.jpg",
      imageCandidates: ["https://img.test/a.jpg", "https://img.test/b.jpg"],
    });

    expect(
      document.querySelectorAll("img[src='https://img.test/a.jpg']"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("img[src='https://img.test/b.jpg']"),
    ).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Slika 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Slika 2" })).toBeTruthy();
  });

  it("leaves a single photo without slide controls", () => {
    renderCard({
      ...base,
      imageUrl: "https://img.test/only.jpg",
      imageCandidates: ["https://img.test/only.jpg"],
    });

    expect(screen.queryByRole("button", { name: "Slika 1" })).toBeNull();
    expect(
      document.querySelectorAll("img[src='https://img.test/only.jpg']"),
    ).toHaveLength(1);
  });
});
