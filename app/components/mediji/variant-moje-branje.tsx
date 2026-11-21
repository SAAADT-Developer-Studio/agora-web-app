import { useEffect, useMemo, useState } from "react";
import { Link, href } from "react-router";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import type {
  BigStory,
  MediaLandscape,
  MediaOutlet,
} from "~/lib/services/mediaLandscape";
import { cn } from "~/lib/utils";
import type { BiasSide } from "~/utils/biasSide";
import {
  BiasChip,
  LimitedDataNote,
  MeterBar,
  OutletLogo,
  SIDE_FILL,
  SIDE_GENITIVE,
  formatPercent,
  outletHref,
  pluralZgodba,
} from "./shared";

const STORAGE_KEY = "vidik:mediji:moje-branje";
const SIDES: BiasSide[] = ["left", "center", "right"];
const SIDE_TITLE: Record<BiasSide, string> = {
  left: "Leva",
  center: "Center",
  right: "Desna",
};

type SideFilter = "all" | BiasSide;

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeStored(keys: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Private mode or blocked storage: the selection just won't persist.
  }
}

function sideCounts(story: BigStory, sideOf: Map<string, BiasSide | null>) {
  const counts: Record<BiasSide, number> = { left: 0, center: 0, right: 0 };
  for (const k of story.outlets) {
    const side = sideOf.get(k);
    if (side) counts[side] += 1;
  }
  return counts;
}

export function MojeBranjeVariant({ data }: { data: MediaLandscape }) {
  const { outlets, bigStories, windowDays } = data;
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<SideFilter>("all");

  useEffect(() => {
    const known = new Set(outlets.map((o) => o.key));
    setSelected(readStored().filter((k) => known.has(k)));
  }, [outlets]);

  const update = (next: string[]) => {
    setSelected(next);
    writeStored(next);
  };
  const toggle = (key: string) =>
    update(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );

  const byReach = useMemo(
    () =>
      [...outlets].sort(
        (a, b) =>
          (b.reach?.percent ?? -1) - (a.reach?.percent ?? -1) ||
          b.bigStoriesCovered - a.bigStoriesCovered,
      ),
    [outlets],
  );
  const visible =
    filter === "all" ? byReach : byReach.filter((o) => o.side === filter);

  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 lg:order-1">
        <SideTabs value={filter} onChange={setFilter} />
        <div
          className="text-primary/55 mt-5 hidden grid-cols-[minmax(0,1fr)_120px_150px_36px] gap-4 border-b border-current/10 px-3 pb-2 text-xs font-semibold md:grid"
          aria-hidden
        >
          <span>Medij</span>
          <span>Mesečni doseg</span>
          <span>Glavne zgodbe ({windowDays} dni)</span>
          <span />
        </div>
        <ul className="mt-2 flex flex-col gap-1 md:mt-0">
          {visible.map((outlet) => (
            <OutletPickRow
              key={outlet.key}
              outlet={outlet}
              bigTotal={bigStories.length}
              selected={selected.includes(outlet.key)}
              onToggle={() => toggle(outlet.key)}
            />
          ))}
        </ul>
      </div>

      <aside className="order-first lg:order-2">
        <div className="lg:sticky lg:top-6">
          <ReadingPanel
            data={data}
            selected={selected}
            onAdd={(k) => update([...selected, k])}
            onPreset={() =>
              update(byReach.filter((o) => o.reach).slice(0, 3).map((o) => o.key))
            }
            onClear={() => update([])}
          />
        </div>
      </aside>
    </div>
  );
}

function SideTabs({
  value,
  onChange,
}: {
  value: SideFilter;
  onChange: (v: SideFilter) => void;
}) {
  const tabs: { key: SideFilter; label: string }[] = [
    { key: "all", label: "Vsi" },
    { key: "left", label: "Leva" },
    { key: "center", label: "Center" },
    { key: "right", label: "Desna" },
  ];
  return (
    <div role="tablist" aria-label="Pokaži medije" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
            value === t.key
              ? "border-primary bg-primary text-primary-text"
              : "text-primary/70 hover:text-primary border-current/15 hover:border-current/30",
          )}
        >
          {t.key !== "all" && (
            <span className={cn("size-2.5 rounded-full", SIDE_FILL[t.key])} />
          )}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function OutletPickRow({
  outlet,
  bigTotal,
  selected,
  onToggle,
}: {
  outlet: MediaOutlet;
  bigTotal: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const coverage = bigTotal ? outlet.bigStoriesCovered / bigTotal : 0;
  return (
    <li
      className={cn(
        "group grid grid-cols-[minmax(0,1fr)_36px] items-center rounded-lg transition-colors",
        selected ? "bg-surface-light shadow-vidik" : "hover:bg-primary/4",
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-[var(--color-electricblue)] md:grid-cols-[minmax(0,1fr)_120px_150px]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
              selected
                ? "border-primary bg-primary text-primary-text"
                : "border-current/25 group-hover:border-current/45",
            )}
            aria-hidden
          >
            {selected && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <OutletLogo outlet={outlet} className="size-9" />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-primary truncate text-[15px] leading-tight font-bold">
              {outlet.name}
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <BiasChip rating={outlet.biasRating} />
              {outlet.owner && (
                <span className="text-primary/55 truncate text-xs">
                  {outlet.owner}
                </span>
              )}
              {outlet.limitedData && <LimitedDataNote />}
            </span>
          </span>
        </span>

        <span className="text-primary/70 flex items-baseline gap-2 pl-[68px] text-xs md:block md:pl-0 md:text-sm">
          <span className="md:hidden">Doseg</span>
          {outlet.reach ? (
            <span className="text-primary font-semibold tabular-nums">
              {formatPercent(outlet.reach.percent / 100)}
              <span className="text-primary/55 font-normal"> spleta</span>
            </span>
          ) : (
            <span className="text-primary/45">ni merjeno</span>
          )}
        </span>

        <span className="flex items-center gap-2 pl-[68px] md:pl-0">
          <span className="text-primary/70 text-xs md:hidden">Glavne zgodbe</span>
          <MeterBar
            value={coverage}
            className={cn("w-16 md:w-full", outlet.limitedData && "opacity-50")}
          />
          <span className="text-primary w-11 shrink-0 text-right text-sm font-semibold whitespace-nowrap tabular-nums">
            {formatPercent(coverage)}
          </span>
        </span>
      </button>
      <Link
        to={outletHref(outlet.key)}
        prefetch="intent"
        aria-label={`Profil medija ${outlet.name}`}
        className="text-primary/45 hover:text-link flex size-9 items-center justify-center rounded-md"
      >
        <ArrowUpRight className="size-4" />
      </Link>
    </li>
  );
}

function ReadingPanel({
  data,
  selected,
  onAdd,
  onPreset,
  onClear,
}: {
  data: MediaLandscape;
  selected: string[];
  onAdd: (key: string) => void;
  onPreset: () => void;
  onClear: () => void;
}) {
  const { outlets, bigStories, windowDays } = data;
  const sideOf = useMemo(
    () => new Map(outlets.map((o) => [o.key, o.side] as const)),
    [outlets],
  );
  const byKey = useMemo(
    () => new Map(outlets.map((o) => [o.key, o] as const)),
    [outlets],
  );

  const result = useMemo(() => {
    const sel = new Set(selected);
    const seen: BigStory[] = [];
    const missed: BigStory[] = [];
    for (const story of bigStories) {
      (story.outlets.some((k) => sel.has(k)) ? seen : missed).push(story);
    }

    // Where the big stories you see come from: each selected outlet's
    // coverage counted once per story, split by its side.
    const mix: Record<BiasSide, number> = { left: 0, center: 0, right: 0 };
    for (const story of seen) {
      for (const k of story.outlets) {
        const side = sideOf.get(k);
        if (sel.has(k) && side) mix[side] += 1;
      }
    }
    const mixTotal = mix.left + mix.center + mix.right;
    const weakest = SIDES.reduce((a, b) => (mix[a] <= mix[b] ? a : b));

    const candidates = outlets
      .filter((o) => !sel.has(o.key) && !o.limitedData && o.side)
      .map((o) => {
        const gain = missed.filter((s) => s.outlets.includes(o.key)).length;
        const sideBonus = mixTotal > 0 && o.side === weakest ? 1.6 : 1;
        return { outlet: o, gain, score: gain * sideBonus };
      })
      .filter((c) => c.gain > 0)
      .sort((a, b) => b.score - a.score);

    return { seen, missed, mix, mixTotal, weakest, suggestions: candidates.slice(0, 2) };
  }, [selected, bigStories, outlets, sideOf]);

  const total = bigStories.length;

  if (selected.length === 0) {
    return (
      <section className="bg-surface-light shadow-vidik rounded-xl p-5">
        <h2 className="text-primary text-xl font-bold">Tvoje branje</h2>
        <p className="text-primary/70 mt-2 text-[15px] leading-snug">
          Označi medije, ki jih bereš. Pokažemo, koliko od {total} najbolj
          pokritih zgodb zadnjih {windowDays} dni vidiš, s katere strani
          prihajajo in katere ti uidejo.
        </p>
        <button
          type="button"
          onClick={onPreset}
          className="bg-primary text-primary-text mt-4 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Začni s tremi najbolj branimi
        </button>
      </section>
    );
  }

  const seenShare = total ? result.seen.length / total : 0;

  return (
    <section
      className="bg-surface-light shadow-vidik rounded-xl p-5"
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-primary text-xl font-bold">Tvoje branje</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-primary/55 hover:text-primary text-xs font-semibold"
        >
          Počisti
        </button>
      </div>
      <div className="mt-3 flex -space-x-1.5">
        {selected.map((k) => {
          const o = byKey.get(k);
          return o ? (
            <OutletLogo
              key={k}
              outlet={o}
              className="ring-surface-light size-7 rounded-full ring-2"
            />
          ) : null;
        })}
      </div>

      <p className="text-primary mt-5 text-[15px] leading-snug">
        Vidiš{" "}
        <strong className="text-2xl font-bold tabular-nums">
          {result.seen.length}
        </strong>{" "}
        od {total} glavnih zgodb zadnjih {windowDays} dni.
      </p>
      <MeterBar value={seenShare} className="mt-2 h-2" fillClassName="bg-primary" />

      <h3 className="text-primary mt-6 text-sm font-bold">
        Od kod prihajajo tvoje zgodbe
      </h3>
      {result.mixTotal > 0 ? (
        <>
          <div
            className="mt-2 flex h-3 overflow-hidden rounded-full"
            role="img"
            aria-label={SIDES.map(
              (s) => `${SIDE_TITLE[s]}: ${formatPercent(result.mix[s] / result.mixTotal)}`,
            ).join(", ")}
          >
            {SIDES.map((s) =>
              result.mix[s] > 0 ? (
                <span
                  key={s}
                  className={cn("transition-[width] duration-500 ease-out", SIDE_FILL[s])}
                  style={{ width: `${(result.mix[s] / result.mixTotal) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <dl className="mt-2 grid grid-cols-3 text-xs">
            {SIDES.map((s) => (
              <div key={s} className={cn(s === "center" && "text-center", s === "right" && "text-right")}>
                <dt className="text-primary/55">{SIDE_TITLE[s]}</dt>
                <dd className="text-primary font-semibold tabular-nums">
                  {formatPercent(result.mix[s] / result.mixTotal)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="text-primary/60 mt-1 text-sm">
          Izbrani mediji v tem obdobju niso pokrili nobene glavne zgodbe.
        </p>
      )}

      {result.suggestions.length > 0 && (
        <>
          <h3 className="text-primary mt-6 text-sm font-bold">Za širši pogled dodaj</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {result.suggestions.map(({ outlet, gain }) => (
              <li
                key={outlet.key}
                className="flex items-center gap-3 rounded-lg border border-current/10 p-2.5"
              >
                <OutletLogo outlet={outlet} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary flex items-center gap-2 text-sm font-bold">
                    <span className="truncate">{outlet.name}</span>
                    <BiasChip rating={outlet.biasRating} />
                  </p>
                  <p className="text-primary/60 text-xs">
                    +{gain} zgodb, ki jih zdaj ne vidiš
                    {result.mixTotal > 0 && outlet.side === result.weakest
                      ? `, več ${SIDE_GENITIVE[outlet.side]} pogledov`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(outlet.key)}
                  aria-label={`Dodaj ${outlet.name}`}
                  className="border-primary/20 hover:bg-primary hover:text-primary-text text-primary flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {result.missed.length > 0 && (
        <>
          <h3 className="text-primary mt-6 text-sm font-bold">
            Uide ti {result.missed.length} {pluralZgodba(result.missed.length)},
            na primer
          </h3>
          <ul className="mt-2 flex flex-col divide-y divide-current/8">
            {result.missed.slice(0, 4).map((story) => {
              const counts = sideCounts(story, sideOf);
              return (
                <li key={story.id} className="py-2.5">
                  <Link
                    to={href("/zgodba/:storyId", { storyId: String(story.id) })}
                    prefetch="intent"
                    className="text-primary hover:text-link line-clamp-2 text-sm leading-snug font-semibold first-letter:uppercase"
                  >
                    {story.title}
                  </Link>
                  <p className="text-primary/55 mt-1 flex items-center gap-1.5 text-xs">
                    <span className="flex gap-0.5" aria-hidden>
                      {SIDES.flatMap((s) =>
                        Array.from({ length: counts[s] }, (_, i) => (
                          <span key={`${s}${i}`} className={cn("size-1.5 rounded-full", SIDE_FILL[s])} />
                        )),
                      )}
                    </span>
                    {story.outlets.length} medijev
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
