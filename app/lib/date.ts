/**
 * Calendar text for Vidik. The Worker runs in UTC and browsers do not, and
 * `toLocale*` strings also differ between workerd and browser ICU data.
 * Numeric parts come from a fixed zone; Slovenian words are ours, so the
 * server HTML and the hydration render are the same characters.
 */
const TIME_ZONE = "Europe/Ljubljana";

const MONTHS_LONG = [
  "januar",
  "februar",
  "marec",
  "april",
  "maj",
  "junij",
  "julij",
  "avgust",
  "september",
  "oktober",
  "november",
  "december",
] as const;

const MONTHS_SHORT = [
  "jan.",
  "feb.",
  "mar.",
  "apr.",
  "maj",
  "jun.",
  "jul.",
  "avg.",
  "sep.",
  "okt.",
  "nov.",
  "dec.",
] as const;

const WEEKDAYS = [
  "nedelja",
  "ponedeljek",
  "torek",
  "sreda",
  "četrtek",
  "petek",
  "sobota",
] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type LjubljanaParts = {
  year: string;
  monthIndex: number;
  day: string;
  hour: string;
  minute: string;
  second: string;
  weekday: string;
  monthLong: string;
  monthShort: string;
};

function ljubljanaParts(date: Date): LjubljanaParts {
  const map = new Map<string, string>();
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") map.set(part.type, part.value);
  }

  const monthIndex = Number(map.get("month")) - 1;
  let hour = map.get("hour") ?? "00";
  if (hour === "24") hour = "00";
  hour = hour.padStart(2, "0");
  const weekdayToken = (map.get("weekday") ?? "").replace(/[^A-Za-z]/g, "");

  return {
    year: map.get("year") ?? "",
    monthIndex,
    day: String(Number(map.get("day"))),
    hour,
    minute: (map.get("minute") ?? "00").padStart(2, "0"),
    second: (map.get("second") ?? "00").padStart(2, "0"),
    weekday: WEEKDAYS[WEEKDAY_INDEX[weekdayToken] ?? 0],
    monthLong: MONTHS_LONG[monthIndex] ?? "",
    monthShort: MONTHS_SHORT[monthIndex] ?? "",
  };
}

/** "16. januar 2026 | 00:30" */
export function formatSlovenianDateTime(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.day}. ${parts.monthLong} ${parts.year} | ${parts.hour}:${parts.minute}`;
}

/** "16. januar 2026" */
export function formatSlovenianLongDate(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.day}. ${parts.monthLong} ${parts.year}`;
}

/** "16. jan." */
export function formatSlovenianShortDate(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.day}. ${parts.monthShort}`;
}

/** "petek, 16. januar" */
export function formatSlovenianWeekdayDate(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.weekday}, ${parts.day}. ${parts.monthLong}`;
}

/** "00:30" in 24-hour form. */
export function formatSlovenianTime(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.hour}:${parts.minute}`;
}

export function formatSlovenianYear(date: Date) {
  return ljubljanaParts(date).year;
}

/** "16. jan. 2026 ob 00:30" */
export function formatArticleTimestamp(date: Date) {
  const parts = ljubljanaParts(date);
  return `${parts.day}. ${parts.monthShort} ${parts.year} ob ${parts.hour}:${parts.minute}`;
}

/** Coverage range: "21. nov., 11:00–13:15" or "20. nov. – 21. nov." */
export function formatSlovenianSpan(oldest: Date, newest: Date) {
  const from = formatSlovenianShortDate(oldest);
  const to = formatSlovenianShortDate(newest);
  if (from === to) {
    const start = formatSlovenianTime(oldest);
    const end = formatSlovenianTime(newest);
    return start === end ? `${from}, ${start}` : `${from}, ${start}–${end}`;
  }
  return `${from} – ${to}`;
}

export function isSameLjubljanaDay(a: Date, b: Date) {
  const left = ljubljanaParts(a);
  const right = ljubljanaParts(b);
  return (
    left.year === right.year &&
    left.monthIndex === right.monthIndex &&
    left.day === right.day
  );
}

/** Grouping separator is always ".", independent of the runtime locale. */
export function formatSlovenianInteger(value: number) {
  const negative = value < 0;
  const digits = Math.abs(Math.trunc(value)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return negative ? `-${grouped}` : grouped;
}
