import { describe, expect, it } from "vitest";
import { storyHook } from "~/lib/utrinki/model";
import {
  biasCountsAddUp,
  biasPercents,
  biasSideLabel,
  countBiasSides,
} from "~/lib/utrinki/bias";

describe("utrinki bias", () => {
  it("maps the five ratings and leaves unrated outlets out", () => {
    const counts = countBiasSides([
      "left",
      "center-left",
      "center",
      "center-right",
      "right",
      null,
      "unknown",
    ]);
    expect(counts).toEqual({
      left: 2,
      center: 1,
      right: 2,
      unrated: 2,
      total: 7,
    });
    expect(biasCountsAddUp(counts)).toBe(true);
    expect(biasSideLabel(null)).toBe("neopredeljen");
    expect(biasSideLabel("left")).toBe("LEVO");
    expect(biasSideLabel("right")).toBe("DESNO");
    expect(biasSideLabel("center")).toBe("CENTER");
  });

  it("builds percents from rated outlets only and makes them sum to 100", () => {
    const design = countBiasSides([
      ...Array.from({ length: 11 }, () => "left"),
      ...Array.from({ length: 5 }, () => "center"),
      ...Array.from({ length: 8 }, () => "right"),
    ]);
    expect(biasPercents(design)).toEqual({ left: 46, center: 21, right: 33 });

    const thirds = countBiasSides(["left", "center", "right"]);
    const percents = biasPercents(thirds);
    expect(percents.left + percents.center + percents.right).toBe(100);

    const withUnrated = countBiasSides(["left", null, null]);
    expect(biasPercents(withUnrated)).toEqual({
      left: 100,
      center: 0,
      right: 0,
    });
    expect(biasPercents(countBiasSides([null, null]))).toEqual({
      left: 0,
      center: 0,
      right: 0,
    });
  });
});

describe("storyHook", () => {
  const hook = (left: number, center: number, right: number, providers = 5) =>
    storyHook({ left, center, right }, providers)?.text ?? null;

  it("names the side that is missing", () => {
    expect(hook(3, 2, 0)).toBe("Desno usmerjeni mediji o tem ne poročajo");
    expect(hook(0, 1, 4)).toBe("Levo usmerjeni mediji o tem ne poročajo");
  });

  it("covers centre-only and both-sides stories", () => {
    expect(hook(0, 3, 0)).toBe("Poročajo le sredinski mediji");
    expect(hook(2, 0, 2)).toBe("Poročajo levi in desni mediji");
  });

  it("stays quiet without enough rated outlets", () => {
    expect(hook(1, 0, 0, 1)).toBeNull();
    expect(hook(1, 0, 0, 4)).toBeNull();
    expect(hook(0, 0, 0)).toBeNull();
  });
});
