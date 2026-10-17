/**
 * Report 301 / 410 / timeout counts for a CSV of article URLs.
 * Not part of CI. Example:
 *   node scripts/audit-clanek-urls.mjs gsc-404.csv --base https://vidik.si
 *
 * Fetches with redirect: "manual" so a 301 is counted instead of followed.
 */

import { readFile } from "node:fs/promises";

const DEFAULT_BASE = "https://vidik.si";
const DEFAULT_TIMEOUT_MS = 5_000;
const CONCURRENCY = 8;

function parseArgs(argv) {
  let csvPath = "";
  let base = DEFAULT_BASE;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base") {
      base = argv[++i] ?? base;
    } else if (arg === "--timeout") {
      timeoutMs = Number(argv[++i]);
    } else if (!arg.startsWith("--") && !csvPath) {
      csvPath = arg;
    }
  }
  if (!csvPath || !Number.isFinite(timeoutMs) || timeoutMs < 1) {
    console.error(
      "Usage: node scripts/audit-clanek-urls.mjs <urls.csv> [--base https://vidik.si] [--timeout 5000]",
    );
    process.exit(1);
  }
  return { csvPath, base: base.replace(/\/$/, ""), timeoutMs };
}

function parseCsv(text) {
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

function urlsFromCsv(text) {
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

function absoluteUrl(value, base) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

async function probe(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    const location = response.headers.get("location") ?? "";
    return {
      status: response.status,
      chained: response.status === 301 && location.includes("/clanek/"),
    };
  } catch (error) {
    const name = error && typeof error === "object" ? error.name : "";
    if (name === "AbortError" || name === "TimeoutError") {
      return { status: "timeout", chained: false };
    }
    return { status: "error", chained: false };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const { csvPath, base, timeoutMs } = parseArgs(process.argv.slice(2));
  const urls = urlsFromCsv(await readFile(csvPath, "utf8")).map((url) =>
    absoluteUrl(url, base),
  );
  const counts = {
    "301": 0,
    "410": 0,
    "404": 0,
    timeout: 0,
    error: 0,
    other: 0,
    chained: 0,
  };

  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;
      const result = await probe(url, timeoutMs);
      if (result.status === 301) counts["301"] += 1;
      else if (result.status === 410) counts["410"] += 1;
      else if (result.status === 404) counts["404"] += 1;
      else if (result.status === "timeout") counts.timeout += 1;
      else if (result.status === "error") counts.error += 1;
      else counts.other += 1;
      if (result.chained) counts.chained += 1;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(
    JSON.stringify(
      {
        checked: urls.length,
        timeoutMs,
        base,
        ...counts,
      },
      null,
      2,
    ),
  );
}

await main();
