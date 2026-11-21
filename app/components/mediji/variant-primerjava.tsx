import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { MediaLandscape, MediaOutlet } from "~/lib/services/mediaLandscape";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import type { BiasSide } from "~/utils/biasSide";
import {
  BIAS_ORDER,
  BiasChip,
  LimitedDataNote,
  MeterBar,
  OutletLogo,
  SIDE_FILL,
  categoryLabel,
  formatLag,
  formatPercent,
  outletHref,
  votesVerdict,
} from "./shared";

type SortKey =
  | "name"
  | "rating"
  | "reach"
  | "agreement"
  | "big"
  | "first"
  | "lag"
  | "paywall";
type Dir = "asc" | "desc";
type SideFilter = "all" | BiasSide;

/** Direction a column sorts in on first click: "more is first". */
const DEFAULT_DIR: Record<SortKey, Dir> = {
  name: "asc",
  rating: "asc",
  reach: "desc",
  agreement: "desc",
  big: "desc",
  first: "desc",
  lag: "asc",
  paywall: "desc",
};

function sortValue(o: MediaOutlet, key: SortKey): number | string | null {
  switch (key) {
    case "name":
      return o.name.toLocaleLowerCase("sl");
    case "rating":
      return o.biasRating ? BIAS_ORDER.indexOf(o.biasRating) : null;
    case "reach":
      return o.reach?.percent ?? null;
    case "agreement":
      return o.votes.agreement;
    case "big":
      return o.bigStoriesCovered;
    case "first":
      return o.limitedData ? null : o.firstShare;
    case "lag":
      return o.medianLagMinutes;
    case "paywall":
      return o.paywallShare;
  }
}

function compare(a: MediaOutlet, b: MediaOutlet, key: SortKey, dir: Dir) {
  const va = sortValue(a, key);
  const vb = sortValue(b, key);
  // Missing values always sink, whichever way the column sorts.
  if (va === null && vb === null) return 0;
  if (va === null) return 1;
  if (vb === null) return -1;
  const c =
    typeof va === "string"
      ? va.localeCompare(vb as string, "sl")
      : (va as number) - (vb as number);
  return dir === "asc" ? c : -c;
}

const COLUMNS: { key: SortKey; label: string; hint: string; align?: "right" }[] = [
  { key: "rating", label: "Ocena", hint: "Vidikova ocena pristranskosti" },
  { key: "reach", label: "Doseg", hint: "Delež slovenskih uporabnikov spleta na mesec (MOSS)" },
  { key: "agreement", label: "Bralci", hint: "Delež glasov bralcev na isti strani kot naša ocena" },
  { key: "big", label: "Glavne zgodbe", hint: "Delež zgodb, o katerih je pisalo vsaj pet medijev" },
  { key: "first", label: "Prvi", hint: "Kako pogosto objavi prvi med mediji, ki pišejo o isti zgodbi", align: "right" },
  { key: "lag", label: "Zamik", hint: "Mediana časa za prvo objavo iste zgodbe", align: "right" },
  { key: "paywall", label: "Plačljivo", hint: "Delež člankov za plačilnim zidom", align: "right" },
];

export function PrimerjavaVariant({ data }: { data: MediaLandscape }) {
  const { outlets, bigStories, windowDays } = data;
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({
    key: "reach",
    dir: "desc",
  });
  const [side, setSide] = useState<SideFilter>("all");
  const [grouped, setGrouped] = useState(false);
  const total = bigStories.length;

  const rows = useMemo(() => {
    const filtered = side === "all" ? outlets : outlets.filter((o) => o.side === side);
    return [...filtered].sort(
      (a, b) => compare(a, b, sort.key, sort.dir) || a.name.localeCompare(b.name, "sl"),
    );
  }, [outlets, side, sort]);

  const groups = useMemo(() => {
    if (!grouped) return [{ owner: null as string | null, rows }];
    const map = new Map<string, MediaOutlet[]>();
    for (const o of rows) {
      const k = o.owner ?? "";
      map.set(k, [...(map.get(k) ?? []), o]);
    }
    return [...map.entries()]
      .map(([owner, list]) => ({ owner: owner || null, rows: list }))
      .sort((a, b) => {
        if (!a.owner) return 1;
        if (!b.owner) return -1;
        return b.rows.length - a.rows.length || compare(a.rows[0], b.rows[0], sort.key, sort.dir);
      });
  }, [rows, grouped, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: DEFAULT_DIR[key] },
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Pokaži medije" className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Vsi"],
              ["left", "Leva"],
              ["center", "Center"],
              ["right", "Desna"],
            ] as [SideFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={side === key}
              onClick={() => setSide(key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
                side === key
                  ? "border-primary bg-primary text-primary-text"
                  : "text-primary/70 hover:text-primary border-current/15 hover:border-current/30",
              )}
            >
              {key !== "all" && <span className={cn("size-2.5 rounded-full", SIDE_FILL[key])} />}
              {label}
            </button>
          ))}
        </div>
        <label className="text-primary flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <Switch checked={grouped} onCheckedChange={setGrouped} />
          Združi po izdajatelju
        </label>
      </div>

      <div className="bg-surface-light shadow-vidik mt-5 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Primerjava slovenskih medijev v zadnjih {windowDays} dneh
          </caption>
          <thead>
            <tr className="text-primary/60 border-b border-current/10 text-xs">
              <SortHeader
                label="Medij"
                hint="Ime medija"
                active={sort.key === "name"}
                dir={sort.dir}
                onClick={() => onSort("name")}
                className="bg-surface-light sticky left-0 z-10 pl-4"
              />
              {COLUMNS.map((c) => (
                <SortHeader
                  key={c.key}
                  label={c.label}
                  hint={c.hint}
                  align={c.align}
                  active={sort.key === c.key}
                  dir={sort.dir}
                  onClick={() => onSort(c.key)}
                />
              ))}
              <th scope="col" className="px-3 py-3 pr-4 font-semibold">
                Teme
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.owner ?? "__none"}>
                {grouped && (
                  <tr className="border-b border-current/10">
                    <th
                      scope="colgroup"
                      colSpan={COLUMNS.length + 2}
                      className="bg-primary/4 text-primary px-4 pt-4 pb-2 text-left text-xs font-bold"
                    >
                      {g.owner ?? "Izdajatelj ni v merjenju MOSS"}
                      <span className="text-primary/50 ml-2 font-normal">
                        {g.rows.length}
                      </span>
                    </th>
                  </tr>
                )}
                {g.rows.map((o) => (
                  <OutletRow key={o.key} outlet={o} bigTotal={total} />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-primary/55 mt-3 max-w-3xl text-xs leading-relaxed">
        Glavne zgodbe: {total} zgodb, o katerih je v zadnjih {windowDays} dneh
        pisalo vsaj pet medijev. Prvi in zamik štejeta zgodbe, o katerih so
        pisali vsaj trije mediji. Doseg: MOSS, zadnji objavljeni mesec. Bralci:
        prikazano od 10 glasov naprej.
      </p>
    </div>
  );
}

function SortHeader({
  label,
  hint,
  active,
  dir,
  align,
  onClick,
  className,
}: {
  label: string;
  hint: string;
  active: boolean;
  dir: Dir;
  align?: "right";
  onClick: () => void;
  className?: string;
}) {
  const Icon = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-3 py-2 font-semibold", align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={onClick}
        title={hint}
        className={cn(
          "hover:text-primary inline-flex items-center gap-1 rounded py-1 whitespace-nowrap transition-colors",
          active && "text-primary",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3", active ? "opacity-100" : "opacity-0")} />
      </button>
    </th>
  );
}

function OutletRow({ outlet, bigTotal }: { outlet: MediaOutlet; bigTotal: number }) {
  const verdict = votesVerdict(outlet);
  const coverage = bigTotal ? outlet.bigStoriesCovered / bigTotal : 0;
  const dim = outlet.limitedData && "text-primary/40";
  return (
    <tr className="group hover:bg-primary/3 border-b border-current/6 last:border-b-0">
      <th
        scope="row"
        className="bg-surface-light group-hover:bg-[color-mix(in_oklch,var(--color-surface-light),var(--color-primary)_3%)] sticky left-0 z-10 py-2.5 pr-3 pl-4 text-left font-normal"
      >
        <Link
          to={outletHref(outlet.key)}
          prefetch="intent"
          className="hover:text-link flex items-center gap-3"
        >
          <OutletLogo outlet={outlet} className="size-8" />
          <span className="flex min-w-0 flex-col">
            <span className="text-primary truncate font-bold">{outlet.name}</span>
            {outlet.limitedData && <LimitedDataNote className="mt-0.5 self-start" />}
          </span>
        </Link>
      </th>
      <td className="px-3">
        <BiasChip rating={outlet.biasRating} />
      </td>
      <td className="px-3">
        {outlet.reach ? (
          <div className="flex w-32 items-center gap-2">
            <MeterBar value={outlet.reach.percent / 100} />
            <span className="text-primary w-10 shrink-0 text-right font-semibold tabular-nums">
              {Math.round(outlet.reach.percent)} %
            </span>
          </div>
        ) : (
          <span className="text-primary/35">ni merjeno</span>
        )}
      </td>
      <td className="px-3 whitespace-nowrap" title={verdict.text}>
        {outlet.votes.agreement === null ? (
          <span className="text-primary/35 tabular-nums">
            {outlet.votes.total > 0 ? `${outlet.votes.total} glasov` : "—"}
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-semibold whitespace-nowrap tabular-nums",
              verdict.tone === "disagree" && "text-[#D4141D] dark:text-[#FF8A8F]",
            )}
          >
            {formatPercent(outlet.votes.agreement)}
            {verdict.tone === "disagree" && outlet.votes.readersSide && (
              <span className="text-primary/60 text-xs font-normal">
                bralci:{" "}
                <span
                  className={cn(
                    "inline-block size-2 rounded-full align-middle",
                    SIDE_FILL[outlet.votes.readersSide],
                  )}
                />
              </span>
            )}
          </span>
        )}
      </td>
      <td className={cn("px-3", dim)}>
        <div className="flex w-36 items-center gap-2">
          <MeterBar value={coverage} className={cn(outlet.limitedData && "opacity-50")} />
          <span className="w-10 shrink-0 text-right font-semibold tabular-nums">
            {formatPercent(coverage)}
          </span>
        </div>
      </td>
      <td className={cn("px-3 text-right font-semibold tabular-nums", dim)}>
        {outlet.limitedData ? "—" : formatPercent(outlet.firstShare)}
      </td>
      <td className={cn("px-3 text-right whitespace-nowrap tabular-nums", dim)}>
        {formatLag(outlet.medianLagMinutes)}
      </td>
      <td className={cn("px-3 text-right tabular-nums", outlet.paywallShare >= 0.25 && "font-bold")}>
        {formatPercent(outlet.paywallShare)}
      </td>
      <td className="text-primary/70 px-3 pr-4 text-xs">
        {outlet.topCategories
          .slice(0, 2)
          .map((c) => categoryLabel(c.key))
          .join(", ") || "—"}
      </td>
    </tr>
  );
}
