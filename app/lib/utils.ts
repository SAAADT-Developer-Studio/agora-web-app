import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InflationSeries } from "~/components/economy-card";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchSloveniaGDP() {
  type JSONStat = {
    id: string[];
    size: number[];
    value: number[] | Record<string, number | null>;
    dimension: Record<
      string,
      {
        category: {
          index?: Record<string, number> | string[];
          label?: Record<string, string>;
        };
      }
    >;
  };
  const url =
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp?freq=A&unit=CP_MEUR&na_item=B1GQ&geo=SI&format=JSON";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat GDP fetch failed: ${res.status}`);
  const data = (await res.json()) as JSONStat;

  const timeKey =
    (data.id || []).find((k) => k.toLowerCase() === "time") ?? "time";
  const timeIdx = data.dimension?.[timeKey]?.category?.index;

  const times = Array.isArray(timeIdx)
    ? timeIdx.map((t, i) => [t, i] as const)
    : timeIdx
      ? Object.entries(timeIdx).sort(
          (a, b) => (a[1] as number) - (b[1] as number),
        )
      : [];

  const raw = data.value;
  const read = (pos: number) =>
    Array.isArray(raw)
      ? (raw[pos] ?? null)
      : ((raw as Record<string, number | null>)[pos] ?? null);

  const series = times
    .map(([year, pos]) => ({ year: String(year), value: read(pos) }))
    .filter(
      (d) => typeof d.value === "number" && Number.isFinite(d.value as number),
    )
    .sort((a, b) => Number(a.year) - Number(b.year));

  return series as { year: string; value: number }[];
}

export type GDPPoint = Awaited<ReturnType<typeof fetchSloveniaGDP>>[number];
type JSONStat = {
  id: string[];
  value: number[] | Record<string, number | null>;
  dimension: Record<
    string,
    { category: { index?: Record<string, number> | string[] } }
  >;
};

export async function fetchInflationMonthlyYoY_SI(): Promise<
  InflationSeries[]
> {
  const url =
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?freq=M&geo=SI&coicop=CP00&unit=RCH_A&format=JSON";

  const res = await fetch(url, { headers: { "Accept-Encoding": "gzip" } });
  if (!res.ok) throw new Error(`Eurostat HICP fetch failed: ${res.status}`);

  const data = (await res.json()) as JSONStat;

  // find "time" dimension & build ordered list of YYYY-MM labels
  const timeKey =
    (data.id || []).find((k) => k.toLowerCase() === "time") ?? "time";
  const idx = data.dimension?.[timeKey]?.category?.index;

  const times: string[] = Array.isArray(idx)
    ? (idx as string[])
    : idx
      ? Object.entries(idx)
          .sort((a, b) => a[1] - b[1])
          .map(([k]) => k) // k already like "1996-01"
      : [];

  // value can be dense array or sparse object keyed by position
  const raw = data.value;
  const readAt = (pos: number) =>
    Array.isArray(raw)
      ? (raw[pos] ?? null)
      : ((raw as Record<string, number | null>)[pos] ?? null);

  const out = times
    .map((label, i) => ({ month: label, value: readAt(i) }))
    .filter(
      (d): d is { month: string; value: number } =>
        typeof d.value === "number" && Number.isFinite(d.value),
    );

  // ensure chronological
  out.sort((a, b) => (a.month < b.month ? -1 : 1));
  return out;
}
