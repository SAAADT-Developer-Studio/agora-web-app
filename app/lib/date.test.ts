import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  formatArticleTimestamp,
  formatSlovenianDateTime,
  formatSlovenianInteger,
  formatSlovenianLongDate,
  formatSlovenianShortDate,
  formatSlovenianSpan,
  formatSlovenianTime,
  formatSlovenianWeekdayDate,
  formatSlovenianYear,
  isSameLjubljanaDay,
} from "~/lib/date";
import { isSameHour } from "~/utils/isSameHour";

// 23:30 UTC on 15 Jan is 00:30 CET on Friday 16 Jan.
const WINTER = new Date("2026-01-15T23:30:00.000Z");
// 22:30 UTC on 15 Jul is 00:30 CEST on Thursday 16 Jul.
const SUMMER = new Date("2026-07-15T22:30:00.000Z");

describe("Ljubljana formatting", () => {
  it("renders winter and summer instants in Europe/Ljubljana", () => {
    expect(formatSlovenianDateTime(WINTER)).toBe("16. januar 2026 | 00:30");
    expect(formatSlovenianLongDate(WINTER)).toBe("16. januar 2026");
    expect(formatSlovenianShortDate(WINTER)).toBe("16. jan.");
    expect(formatSlovenianWeekdayDate(WINTER)).toBe("petek, 16. januar");
    expect(formatSlovenianTime(WINTER)).toBe("00:30");
    expect(formatSlovenianYear(WINTER)).toBe("2026");
    expect(formatArticleTimestamp(WINTER)).toBe("16. jan. 2026 ob 00:30");

    expect(formatSlovenianDateTime(SUMMER)).toBe("16. julij 2026 | 00:30");
    expect(formatSlovenianWeekdayDate(SUMMER)).toBe("četrtek, 16. julij");
  });

  it("splits a coverage range on the Ljubljana day, not the UTC day", () => {
    const lateUtc = new Date("2026-01-15T22:00:00.000Z");
    const afterMidnight = new Date("2026-01-15T23:30:00.000Z");
    expect(isSameLjubljanaDay(lateUtc, afterMidnight)).toBe(false);
    expect(formatSlovenianSpan(lateUtc, afterMidnight)).toBe(
      "15. jan. – 16. jan.",
    );

    const morning = new Date("2026-11-21T10:00:00.000Z");
    const afternoon = new Date("2026-11-21T12:15:00.000Z");
    expect(isSameLjubljanaDay(morning, afternoon)).toBe(true);
    expect(formatSlovenianSpan(morning, afternoon)).toBe(
      "21. nov., 11:00–13:15",
    );
    expect(isSameHour(morning, new Date("2026-11-21T10:00:40.000Z"))).toBe(
      true,
    );
    expect(isSameHour(morning, afternoon)).toBe(false);
  });

  it("groups integers with a dot, whatever the runtime locale is", () => {
    expect(formatSlovenianInteger(1234567)).toBe("1.234.567");
    expect(formatSlovenianInteger(0)).toBe("0");
    expect(formatSlovenianInteger(-1200)).toBe("-1.200");
  });

  it("does not follow the host timezone", () => {
    const script = `
      import { formatSlovenianLongDate, formatSlovenianTime } from "./app/lib/date.ts";
      const date = new Date("2026-07-15T22:30:00.000Z");
      process.stdout.write(formatSlovenianLongDate(date) + "|" + formatSlovenianTime(date));
    `;
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-e", script],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          TZ: "Pacific/Kiritimati",
          NODE_NO_WARNINGS: "1",
        },
        encoding: "utf8",
      },
    );
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("16. julij 2026|00:30");
  });
});
