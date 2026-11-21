import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Globe } from "lucide-react";
import type { MediaLandscape, MediaOutlet } from "~/lib/services/mediaLandscape";
import { cn } from "~/lib/utils";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { removeUrlProtocol } from "~/utils/removeUrlProtocol";
import {
  BIAS_FILL,
  BIAS_ORDER,
  BiasChip,
  LimitedDataNote,
  MeterBar,
  OutletLogo,
  VoteBar,
  categoryLabel,
  formatLag,
  formatPeople,
  formatPercent,
  outletHref,
  votesVerdict,
} from "./shared";

const MAX_LOGO = 76;
const MIN_LOGO = 30;

function logoSize(outlet: MediaOutlet, maxPercent: number) {
  if (!outlet.reach) return MIN_LOGO;
  const t = Math.sqrt(outlet.reach.percent / maxPercent);
  return Math.round(MIN_LOGO + (MAX_LOGO - MIN_LOGO) * t);
}

export function SpekterVariant({ data }: { data: MediaLandscape }) {
  const { outlets } = data;
  const sorted = useMemo(
    () =>
      [...outlets].sort(
        (a, b) =>
          (b.reach?.percent ?? -1) - (a.reach?.percent ?? -1) ||
          b.bigStoriesCovered - a.bigStoriesCovered,
      ),
    [outlets],
  );
  const [selectedKey, setSelectedKey] = useState(sorted[0]?.key);
  const profileRef = useRef<HTMLDivElement>(null);
  const maxPercent = Math.max(...outlets.map((o) => o.reach?.percent ?? 0), 1);
  const selected = outlets.find((o) => o.key === selectedKey) ?? sorted[0];
  const unrated = sorted.filter((o) => !o.biasRating);

  const select = (key: string) => {
    setSelectedKey(key);
    if (window.matchMedia("(max-width: 767px)").matches) {
      profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      <div className="bg-surface-light shadow-vidik rounded-xl p-3 md:p-5">
        <div className="grid grid-cols-5 gap-1.5 md:gap-4">
          {BIAS_ORDER.map((rating) => {
            const column = sorted.filter((o) => o.biasRating === rating);
            return (
              <section key={rating} aria-label={biasKeyToLabel(rating)} className="min-w-0">
                <div className={cn("h-1.5 rounded-full", BIAS_FILL[rating])} />
                <h2 className="text-primary mt-2 text-center text-[11px] font-bold tracking-wide uppercase md:text-xs">
                  {biasKeyToLabel(rating)}
                </h2>
                <ul className="mt-3 flex flex-col items-center gap-3 md:gap-4">
                  {column.map((o) => (
                    <li key={o.key} className="w-full">
                      <RibbonOutlet
                        outlet={o}
                        size={logoSize(o, maxPercent)}
                        selected={o.key === selected?.key}
                        onSelect={() => select(o.key)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        {unrated.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-current/10 pt-4">
            <span className="text-primary/55 text-xs font-semibold">Brez ocene</span>
            {unrated.map((o) => (
              <RibbonOutlet
                key={o.key}
                outlet={o}
                size={MIN_LOGO}
                inline
                selected={o.key === selected?.key}
                onSelect={() => select(o.key)}
              />
            ))}
          </div>
        )}
        <p className="text-primary/55 mt-4 text-xs">
          Velikost logotipa ustreza mesečnemu dosegu (MOSS). Manjši logotipi
          brez podatka o dosegu niso merjeni.
        </p>
      </div>

      <div ref={profileRef} className="scroll-mt-4">
        {selected && <Profile outlet={selected} data={data} onSelect={select} />}
      </div>
    </div>
  );
}

function RibbonOutlet({
  outlet,
  size,
  selected,
  inline = false,
  onSelect,
}: {
  outlet: MediaOutlet;
  size: number;
  selected: boolean;
  inline?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex min-w-0 items-center rounded-lg p-1 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-electricblue)]",
        inline ? "gap-2 pr-2" : "w-full flex-col gap-1.5",
        selected ? "bg-primary/8" : "hover:bg-primary/4",
      )}
    >
      <OutletLogo
        outlet={outlet}
        className={cn(
          "transition-[box-shadow,transform] duration-300 ease-out",
          "max-md:size-[clamp(26px,var(--s),48px)]!",
          selected
            ? "ring-primary ring-offset-surface-light scale-105 ring-2 ring-offset-2"
            : "group-hover:scale-105",
          outlet.limitedData && "opacity-55 grayscale",
        )}
        style={{ width: size, height: size, ["--s" as string]: `${size * 0.62}px` }}
      />
      <span
        className={cn(
          "text-primary max-w-full truncate text-center text-[11px] leading-tight font-semibold md:text-xs",
          !inline && "max-sm:hidden",
        )}
      >
        {outlet.name}
      </span>
    </button>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 border-t border-current/10 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
      <dt className="text-primary/60 text-sm font-semibold">{label}</dt>
      <dd className="text-primary min-w-0 text-[15px] leading-snug">{children}</dd>
    </div>
  );
}

function MiniOutlet({
  outlet,
  note,
  onSelect,
}: {
  outlet: MediaOutlet;
  note?: string;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(outlet.key)}
      className="hover:bg-primary/5 flex items-center gap-2 rounded-lg border border-current/10 py-1 pr-2.5 pl-1 text-left transition-colors"
    >
      <OutletLogo outlet={outlet} className="size-7" />
      <span className="text-sm font-semibold">{outlet.name}</span>
      {note && <span className="text-primary/55 text-xs tabular-nums">{note}</span>}
    </button>
  );
}

function Profile({
  outlet,
  data,
  onSelect,
}: {
  outlet: MediaOutlet;
  data: MediaLandscape;
  onSelect: (key: string) => void;
}) {
  const byKey = new Map(data.outlets.map((o) => [o.key, o] as const));
  const total = data.bigStories.length;
  const verdict = votesVerdict(outlet);
  const siblings = outlet.owner
    ? data.outlets.filter((o) => o.owner === outlet.owner && o.key !== outlet.key)
    : [];
  const counterpart = outlet.counterpart ? byKey.get(outlet.counterpart.key) : null;

  return (
    <article
      key={outlet.key}
      className="animate-in fade-in slide-in-from-bottom-2 mt-8 grid gap-8 duration-300 md:mt-10 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <header className="flex gap-4 lg:flex-col">
        <OutletLogo outlet={outlet} className="size-20 lg:size-28" />
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-primary text-3xl leading-none font-bold tracking-tight md:text-4xl">
            {outlet.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <BiasChip rating={outlet.biasRating} className="text-xs" />
            {outlet.limitedData && <LimitedDataNote />}
          </div>
          {outlet.owner && (
            <p className="text-primary/65 text-sm">
              Izdajatelj: <span className="text-primary font-semibold">{outlet.owner}</span>
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <a
              href={outlet.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary/70 hover:text-link flex items-center gap-1"
            >
              <Globe className="size-3.5" />
              {removeUrlProtocol(outlet.url)}
            </a>
            <Link
              to={outletHref(outlet.key)}
              prefetch="intent"
              className="text-link flex items-center gap-1 hover:underline"
            >
              Glasuj o oceni
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <dl className="min-w-0">
        <Fact label="Kdo ga bere">
          {outlet.reach ? (
            <>
              <p>
                <strong className="text-2xl font-bold tabular-nums">
                  {formatPercent(outlet.reach.percent / 100)}
                </strong>{" "}
                slovenskih uporabnikov spleta mesečno, približno{" "}
                {formatPeople(outlet.reach.people)} ljudi.
              </p>
              <p className="text-primary/60 mt-1 text-sm">
                Povprečen obisk traja {outlet.reach.avgSessionDuration} min · glede na
                prejšnji mesec {outlet.reach.trend > 0 ? "+" : ""}
                {outlet.reach.trend.toLocaleString("sl-SI")} %
              </p>
            </>
          ) : (
            <p className="text-primary/60">Medij ni vključen v merjenje MOSS.</p>
          )}
        </Fact>

        <Fact label="Kaj pravijo bralci">
          <VoteBar votes={outlet.votes} className="max-w-sm" />
          <p
            className={cn(
              "mt-2",
              verdict.tone === "disagree" && "font-semibold",
              verdict.tone === "few" && "text-primary/60",
            )}
          >
            {verdict.text}
          </p>
          {outlet.votes.total > 0 && (
            <p className="text-primary/55 mt-0.5 text-xs">{outlet.votes.total} glasov</p>
          )}
        </Fact>

        <Fact label="Glavne zgodbe">
          <div className="flex max-w-sm items-center gap-3">
            <MeterBar value={total ? outlet.bigStoriesCovered / total : 0} className="h-2" />
            <span className="font-semibold tabular-nums whitespace-nowrap">
              {outlet.bigStoriesCovered} / {total}
            </span>
          </div>
          <p className="text-primary/60 mt-1.5 text-sm">
            Od {total} zgodb, o katerih je v {data.windowDays} dneh
            pisalo vsaj pet medijev.
          </p>
        </Fact>

        <Fact label="Hitrost">
          {outlet.medianLagMinutes !== null ? (
            <p>
              Prvi objavi pri{" "}
              <strong className="tabular-nums">{formatPercent(outlet.firstShare)}</strong>{" "}
              skupnih zgodb. Sicer običajno{" "}
              <strong className="tabular-nums">{formatLag(outlet.medianLagMinutes)}</strong>{" "}
              za prvim medijem.
            </p>
          ) : (
            <p className="text-primary/60">Premalo skupnih zgodb za oceno.</p>
          )}
        </Fact>

        {outlet.agenda !== null && (
          <Fact label="Izbor zgodb">
            <AgendaScale value={outlet.agenda} />
            <p className="text-primary/60 mt-2 text-sm">
              Kdo še piše o zgodbah, ki jih izbere {outlet.name}, v primerjavi s
              povprečnim medijem. Meri izbor tem, ne tona.
            </p>
          </Fact>
        )}

        <Fact label="O čem piše">
          {outlet.topCategories.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {outlet.topCategories.map((c) => (
                <li
                  key={c.key}
                  className="bg-primary/6 rounded-md px-2 py-1 text-sm font-semibold"
                >
                  {categoryLabel(c.key)}{" "}
                  <span className="text-primary/55 font-normal tabular-nums">
                    {formatPercent(c.share)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-primary/60">Ni podatkov.</p>
          )}
        </Fact>

        <Fact label="Za plačilnim zidom">
          <p>
            <strong className="tabular-nums">{formatPercent(outlet.paywallShare)}</strong>{" "}
            člankov
          </p>
        </Fact>

        {outlet.similar.length > 0 && (
          <Fact label="Podoben izbor zgodb">
            <div className="flex flex-wrap gap-2">
              {outlet.similar.map((s) => {
                const o = byKey.get(s.key);
                return o ? (
                  <MiniOutlet
                    key={s.key}
                    outlet={o}
                    note={formatPercent(s.overlap)}
                    onSelect={onSelect}
                  />
                ) : null;
              })}
            </div>
            <p className="text-primary/55 mt-2 text-xs">
              Delež skupnih zgodb med obema medijema.
            </p>
          </Fact>
        )}

        {counterpart && (
          <Fact label="Iste zgodbe z druge strani">
            <MiniOutlet
              outlet={counterpart}
              note={biasKeyToLabel(counterpart.biasRating ?? "")}
              onSelect={onSelect}
            />
          </Fact>
        )}

        {siblings.length > 0 && (
          <Fact label="Isti izdajatelj">
            <div className="flex flex-wrap gap-2">
              {siblings.map((o) => (
                <MiniOutlet key={o.key} outlet={o} onSelect={onSelect} />
              ))}
            </div>
          </Fact>
        )}
      </dl>
    </article>
  );
}

function AgendaScale({ value }: { value: number }) {
  const pos = ((value + 1) / 2) * 100;
  return (
    <div className="max-w-sm">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#FA2D36]/60 via-current/10 to-[#2D7EFF]/60">
        <span
          className="bg-primary ring-surface absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-[left] duration-500 ease-out"
          style={{ left: `${pos}%` }}
        />
        <span className="bg-primary/40 absolute top-1/2 left-1/2 h-3.5 w-px -translate-y-1/2" />
      </div>
      <div className="text-primary/55 mt-1.5 flex justify-between text-xs">
        <span>kot levi mediji</span>
        <span>povprečje</span>
        <span>kot desni mediji</span>
      </div>
    </div>
  );
}
