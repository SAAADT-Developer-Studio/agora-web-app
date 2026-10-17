import { describe, expect, it } from "vitest";
import { biasSide } from "~/utils/biasSide";

describe("biasSide", () => {
  it("folds the five ratings into three sides", () => {
    expect(
      ["left", "center-left", "center", "center-right", "right"].map(biasSide),
    ).toEqual(["left", "left", "center", "right", "right"]);
  });

  it("returns null for unrated or unknown providers", () => {
    expect(biasSide(null)).toBeNull();
    expect(biasSide("unknown")).toBeNull();
  });
});
