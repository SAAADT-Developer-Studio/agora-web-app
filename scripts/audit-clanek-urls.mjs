/**
 * Report 301 / 410 / timeout counts for a CSV of article URLs.
 * Not part of CI. Example:
 *   node scripts/audit-clanek-urls.mjs gsc-404.csv --base https://preview.example --concurrency 2
 *
 * Stdout is CSV: url,status,location,final_status.
 * A one-line JSON summary goes to stderr.
 * Fetches with redirect: "manual", then checks the Location target once.
 */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE = "https://vidik.si";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_CONCURRENCY = 2;

export function parseArgs(argv) {
  let csvPath = "";
  let base = DEFAULT_BASE;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let concurrency = DEFAULT_CONCURRENCY;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base") {
      base = argv[++i] ?? base;
    } else if (arg === "--timeout") {
      timeoutMs = Number(argv[++i]);
    } else if (arg === "--concurrency") {
      concurrency = Number(argv[++i]);
    } else if (!arg.startsWith("--") && !csvPath) {
      csvPath = arg;
    }
  }
  if (
    !csvPath ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 1 ||
    !Number.isInteger(concurrency) ||
    concurrency < 1
  ) {
    console.error(
      "Usage: node scripts/audit-clanek-urls.mjs <urls.csv> [--base https://vidik.si] [--timeout 5000] [--concurrency 2]",
    );
    process.exit(1);
  }
  return { csvPath, base: base.replace(/\/$/, ""), timeoutMs, concurrency };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

export function urlsFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const urlColumn = header.findIndex((cell) => cell === "url" || cell === "page");
  const start = urlColumn >= 0 ? 1 : 0;
  const column = urlColumn >= 0 ? urlColumn : 0;
  const urls = [];
  for (const row of rows.slice(start)) {
    const values = urlColumn >= 0 ? [row[column] ?? ""] : row;
    for (const value of values) {
      const trimmed = value.trim();
      if (trimmed.startsWith("http") || trimmed.includes("/clanek/")) {
        urls.push(trimmed);
      }
    }
  }
  return [...new Set(urls)];
}

/** Point every URL at `--base`, including absolute ones (host and protocol). */
export function absoluteUrl(value, base) {
  const baseUrl = new URL(base.includes("://") ? base : `https://${base}`);
  const absolute =
    value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value)
      : new URL(value.startsWith("/") ? value : `/${value}`, baseUrl);
  absolute.protocol = baseUrl.protocol;
  absolute.host = baseUrl.host;
  return absolute.href;
}

export function documentPath(url) {
  const pathname = new URL(url).pathname;
  if (pathname.endsWith("/_.data")) {
    return pathname.slice(0, -"/_.data".length) || "/";
  }
  if (pathname.endsWith(".data")) {
    return pathname.slice(0, -".data".length) || "/";
  }
  return pathname;
}

/**
 * A redirect chains when Location still contains `/clanek/`, or when the
 * document path is unchanged (`/zgodba/1` → `/zgodba/1`, including `.data`).
 */
export function isRedirectLoop(requestUrl, location) {
  if (!location) return false;
  let target;
  try {
    target = new URL(location, requestUrl);
  } catch {
    return false;
  }
  if (target.pathname.includes("/clanek/")) return true;
  return documentPath(requestUrl) === documentPath(target.href);
}

export function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function csvRow(fields) {
  return fields.map((field) => csvCell(field)).join(",");
}

async function fetchOnce(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    return {
      status: response.status,
      location: response.headers.get("location") ?? "",
    };
  } catch (error) {
    const name = error && typeof error === "object" ? error.name : "";
    if (name === "AbortError" || name === "TimeoutError") {
      return { status: "timeout", location: "" };
    }
    return { status: "error", location: "" };
  } finally {
    clearTimeout(timer);
  }
}

export async function probe(url, timeoutMs) {
  const first = await fetchOnce(url, timeoutMs);
  let finalStatus = first.status;
  const redirects =
    typeof first.status === "number" &&
    first.status >= 300 &&
    first.status < 400 &&
    first.location;
  if (redirects) {
    try {
      const next = new URL(first.location, url).href;
      const second = await fetchOnce(next, timeoutMs);
      finalStatus = second.status;
    } catch {
      finalStatus = "error";
    }
  }
  return {
    status: first.status,
    location: first.location,
    finalStatus,
    chained: isRedirectLoop(url, first.location),
  };
}

export async function main() {
  const { csvPath, base, timeoutMs, concurrency } = parseArgs(
    process.argv.slice(2),
  );
  const urls = urlsFromCsv(await readFile(csvPath, "utf8")).map((url) =>
    absoluteUrl(url, base),
  );
  const counts = {
    "301": 0,
    "410": 0,
    "404": 0,
    "503": 0,
    timeout: 0,
    error: 0,
    other: 0,
    chained: 0,
    final200: 0,
  };

  console.log(csvRow(["url", "status", "location", "final_status"]));

  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;
      const result = await probe(url, timeoutMs);
      console.log(
        csvRow([url, result.status, result.location, result.finalStatus]),
      );
      if (result.status === 301) counts["301"] += 1;
      else if (result.status === 410) counts["410"] += 1;
      else if (result.status === 404) counts["404"] += 1;
      else if (result.status === 503) counts["503"] += 1;
      else if (result.status === "timeout") counts.timeout += 1;
      else if (result.status === "error") counts.error += 1;
      else counts.other += 1;
      if (result.chained) counts.chained += 1;
      if (result.finalStatus === 200) counts.final200 += 1;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.error(
    JSON.stringify(
      {
        checked: urls.length,
        timeoutMs,
        concurrency,
        base,
        ...counts,
      },
      null,
      2,
    ),
  );
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  await main();
}
