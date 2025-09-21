import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
