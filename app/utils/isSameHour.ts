import { formatSlovenianTime } from "~/lib/date";

/** Same displayed Ljubljana hour and minute (the article range hides a zero-length span). */
export function isSameHour(date1: Date, date2: Date) {
  return formatSlovenianTime(date1) === formatSlovenianTime(date2);
}
