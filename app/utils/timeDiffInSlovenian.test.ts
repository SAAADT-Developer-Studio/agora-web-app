import { describe, expect, it } from "vitest";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

describe("timeDiffInSlovenian", () => {
  const now = new Date("2026-11-21T12:05:10.000Z");

  it("counts from the supplied instant", () => {
    expect(timeDiffInSlovenian(new Date("2026-11-21T12:00:00.000Z"), now)).toBe(
      "pred 5 minutami",
    );
    expect(timeDiffInSlovenian(new Date("2026-11-21T11:05:10.000Z"), now)).toBe(
      "pred 1 uro",
    );
    expect(timeDiffInSlovenian(new Date("2026-11-19T12:05:10.000Z"), now)).toBe(
      "pred 2 dnevoma",
    );
  });
});
