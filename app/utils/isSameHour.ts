export function isSameHour(date1: Date, date2: Date) {
  return (
    date1.toLocaleTimeString("sl-SI", {
      hour: "2-digit",
      minute: "2-digit",
    }) ===
    date2.toLocaleTimeString("sl-SI", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}
