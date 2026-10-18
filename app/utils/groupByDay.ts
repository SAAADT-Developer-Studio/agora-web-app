const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Ljubljana",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Splits already-sorted items into runs that share a Ljubljana calendar day.
 * Fixed time zone so the server and browser render the same groups.
 */
export function groupByDay<T extends { publishedAt: string }>(
  items: T[],
): { dayKey: string; date: Date; items: T[] }[] {
  const groups: { dayKey: string; date: Date; items: T[] }[] = [];
  for (const item of items) {
    const date = new Date(item.publishedAt);
    const dayKey = dayKeyFormatter.format(date);
    const last = groups.at(-1);
    if (last?.dayKey === dayKey) {
      last.items.push(item);
    } else {
      groups.push({ dayKey, date, items: [item] });
    }
  }
  return groups;
}
