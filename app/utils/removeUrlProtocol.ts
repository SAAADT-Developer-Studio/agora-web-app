export function removeUrlProtocol(url: string) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "");
}
