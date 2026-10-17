import { describe, expect, it } from "vitest";
import { groupByDay } from "~/utils/groupByDay";

describe("groupByDay", () => {
  it("groups by Ljubljana calendar day, keeping input order", () => {
    const items = [
      { id: 1, publishedAt: "2026-10-17T10:00:00.000Z" },
      { id: 2, publishedAt: "2026-10-17T08:00:00.000Z" },
      { id: 3, publishedAt: "2026-10-16T12:00:00.000Z" },
    ];

    expect(
      groupByDay(items).map((g) => [g.dayKey, g.items.map((i) => i.id)]),
    ).toEqual([
      ["2026-10-17", [1, 2]],
      ["2026-10-16", [3]],
    ]);
  });

  it("puts a late-evening UTC time on the next Ljubljana day", () => {
    // 22:30 UTC on Oct 16 is 00:30 CEST on Oct 17.
    const [group] = groupByDay([
      { id: 1, publishedAt: "2026-10-16T22:30:00.000Z" },
    ]);
    expect(group.dayKey).toBe("2026-10-17");
  });

  it("starts a new group when a day reappears after another", () => {
    const groups = groupByDay([
      { id: 1, publishedAt: "2026-10-17T10:00:00.000Z" },
      { id: 2, publishedAt: "2026-10-16T10:00:00.000Z" },
      { id: 3, publishedAt: "2026-10-17T09:00:00.000Z" },
    ]);
    expect(groups.map((g) => g.dayKey)).toEqual([
      "2026-10-17",
      "2026-10-16",
      "2026-10-17",
    ]);
  });
});
