export function formatSlovenianDateTime(date: Date) {
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // Use 24-hour format
  } as const;

  const formatter = new Intl.DateTimeFormat("sl-SI", options);
  const parts = formatter.formatToParts(date);

  // Extract day, month, year
  const day = parts.find((p) => p.type === "day").value;
  const month = parts.find((p) => p.type === "month").value;
  const year = parts.find((p) => p.type === "year").value;

  // Extract hour and minute
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;

  return `${day}. ${month} ${year} | ${hour}.${minute}`;
}
