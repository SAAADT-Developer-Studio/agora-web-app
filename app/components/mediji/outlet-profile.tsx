import type { ReactNode } from "react";
import { Link } from "react-router";
import { CircleCheck } from "lucide-react";
import type { BiasRating } from "~/enums/biasRatingKey";
import type { MediaOutlet } from "~/lib/services/mediaLandscape";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import {
  BIAS_FILL,
  BIAS_ORDER,
  BiasChip,
  InfoTip,
  MeterBar,
  OutletLogo,
  categoryLabel,
  formatLag,
  formatPeople,
  formatPercent,
  outletHref,
  votesVerdict,
} from "./shared";

export type RelatedOutlet = Pick<
  MediaOutlet,
  "key" | "name" | "biasRating" | "owner"
>;

/** "Kam spada X?": the reader vote; `children` renders under it (suggestions after voting). */
export function OutletVoting({
  outlet,
  voteValue,
  pending,
  onVote,
  children,
}: {
  outlet: MediaOutlet;
  /** The viewer's current vote, as stored. */
  voteValue: string | undefined;
  pending: boolean;
  onVote: (value: BiasRating) => void;
  children?: ReactNode;
}) {
  const verdict = votesVerdict(outlet);
  return (
    <section className="bg-surface-light shadow-vidik rounded-xl p-4 md:p-6">
      <h2 className="text-primary text-xl font-bold tracking-tight md:text-2xl">
        Kam spada {outlet.name}?
      </h2>
      <p className="text-primary/70 mt-1 text-[15px] leading-snug">
        {verdict.text}
        {outlet.votes.total > 0 && ` Skupaj ${outlet.votes.total} glasov.`}
      </p>

      <div className="mt-4 grid grid-cols-5 gap-1.5 md:gap-2">
        {BIAS_ORDER.map((value) => {
          const selected = voteValue === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onVote(value)}
              disabled={pending}
              aria-pressed={selected}
              className={cn(
                "flex min-w-0 flex-col items-start rounded-lg border p-2 text-left transition-colors disabled:cursor-wait md:p-3",
                selected
                  ? "border-primary bg-primary/6"
                  : "hover:border-primary/40 hover:bg-primary/3 border-current/12",
              )}
            >
              <span
                className={cn("h-1.5 w-full rounded-full", BIAS_FILL[value])}
              />
              <span className="mt-2 flex w-full items-start justify-between gap-1">
                <span className="text-primary text-xs leading-tight font-bold md:text-[15px]">
                  {biasKeyToLabel(value)}
                </span>
                {selected &&
                  (pending ? (
                    <Spinner className="size-4 shrink-0 fill-current md:size-5" />
                  ) : (
                    <CircleCheck className="size-4 shrink-0 md:size-5" />
                  ))}
              </span>
              <span className="text-primary/55 mt-0.5 text-[11px] tabular-nums md:text-xs">
                {outlet.votes.byRating[value]} glasov
              </span>
              {outlet.biasRating === value && (
                <span className="text-primary/55 mt-1 text-[10px] leading-tight md:text-[11px]">
                  naša ocena
                </span>
              )}
            </button>
          );
        })}
      </div>

      {children}
    </section>
  );
}

export function VoteSuggestions({ outlets }: { outlets: RelatedOutlet[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 mt-5 border-t border-current/10 pt-5 duration-500">
      <h3 className="text-primary font-bold">
        Hvala! Glasuj še za druge medije
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {outlets.slice(0, 4).map((o) => (
          <li key={o.key}>
            <OutletRow outlet={o} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  value,
  label,
  info,
  children,
}: {
  value: ReactNode;
  label: string;
  info: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse justify-end py-4 sm:px-5 sm:first:pl-0">
      <dt className="text-primary/65 mt-1.5 flex items-center gap-1 text-sm">
        {label}
        <InfoTip label={label}>{info}</InfoTip>
      </dt>
      <dd className="text-primary text-3xl leading-none font-bold tracking-tight tabular-nums">
        {value}
        {children}
      </dd>
    </div>
  );
}

/** How the outlet reports: big-story coverage, speed, topics. */
export function OutletCoverage({
  outlet,
  bigStoriesTotal,
  windowDays,
}: {
  outlet: MediaOutlet;
  bigStoriesTotal: number;
  windowDays: number;
}) {
  const coverage = bigStoriesTotal
    ? outlet.bigStoriesCovered / bigStoriesTotal
    : 0;
  const noSpeed = outlet.medianLagMinutes === null;
  return (
    <section>
      <h2 className="text-primary text-xl font-bold tracking-tight md:text-2xl">
        Kako poroča
      </h2>
      <p className="text-primary/60 mt-1 text-sm">Zadnjih {windowDays} dni.</p>

      <dl className="mt-3 grid border-y border-current/10 sm:grid-cols-3 sm:divide-x sm:divide-current/10">
        <Stat
          value={formatPercent(coverage)}
          label="glavnih zgodb pokrije"
          info={`Glavne zgodbe so tiste, o katerih je v zadnjih ${windowDays} dneh pisalo vsaj pet medijev. ${outlet.name}: ${outlet.bigStoriesCovered} od ${bigStoriesTotal}.`}
        >
          <MeterBar value={coverage} className="mt-3 max-w-40" />
        </Stat>
        <Stat
          value={noSpeed ? "—" : formatPercent(outlet.firstShare)}
          label="zgodb objavi prvi"
          info="Med zgodbami, o katerih so pisali vsaj trije mediji: kako pogosto je ta medij objavil prvi."
        />
        <Stat
          value={formatLag(outlet.medianLagMinutes)}
          label="običajno za prvim medijem"
          info="Mediana časa med prvo objavo zgodbe na katerem koli mediju in objavo na tem mediju."
        />
      </dl>

      {outlet.topCategories.length > 0 && (
        <>
          <h3 className="text-primary mt-6 text-sm font-bold">O čem piše</h3>
          <ul className="mt-3 flex max-w-md flex-col gap-2.5">
            {outlet.topCategories.map((c) => (
              <li
                key={c.key}
                className="grid grid-cols-[120px_minmax(0,1fr)_44px] items-center gap-3 text-sm"
              >
                <span className="text-primary font-semibold">
                  {categoryLabel(c.key)}
                </span>
                <MeterBar value={c.share} />
                <span className="text-primary/70 text-right tabular-nums">
                  {formatPercent(c.share)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function OutletRow({ outlet, note }: { outlet: RelatedOutlet; note?: string }) {
  return (
    <Link
      to={outletHref(outlet.key)}
      prefetch="intent"
      className="hover:bg-primary/5 -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors"
    >
      <OutletLogo outlet={outlet} className="size-9" />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="text-primary truncate text-sm font-bold">
          {outlet.name}
        </span>
        <BiasChip rating={outlet.biasRating} />
      </span>
      {note && (
        <span className="text-primary/60 text-sm tabular-nums">{note}</span>
      )}
    </Link>
  );
}

function SideSection({
  title,
  info,
  children,
}: {
  title: string;
  info: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-current/10 py-5 first:border-t-0 first:pt-0">
      <h2 className="text-primary flex items-center gap-1 text-sm font-bold">
        {title}
        <InfoTip label={title}>{info}</InfoTip>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Readership, related outlets and publisher. */
export function OutletSidebar({
  outlet,
  related,
}: {
  outlet: MediaOutlet;
  related: Record<string, RelatedOutlet>;
}) {
  const counterpart = outlet.counterpart && related[outlet.counterpart.key];
  const siblings = Object.values(related).filter(
    (o) => o.owner === outlet.owner && o.key !== outlet.key,
  );

  return (
    <div>
      <SideSection
        title="Bralci"
        info="Mesečni doseg po meritvi MOSS: delež slovenskih uporabnikov spleta, ki medij obiščejo vsaj enkrat na mesec."
      >
        {outlet.reach ? (
          <>
            <p className="text-primary text-3xl leading-none font-bold tabular-nums">
              {formatPercent(outlet.reach.percent / 100)}
            </p>
            <p className="text-primary/70 mt-1.5 text-sm leading-snug">
              slovenskih uporabnikov spleta mesečno, približno{" "}
              {formatPeople(outlet.reach.people)} ljudi. Povprečen obisk traja{" "}
              {outlet.reach.avgSessionDuration} min.
            </p>
          </>
        ) : (
          <p className="text-primary/60 text-sm">
            Medij ni vključen v merjenje MOSS.
          </p>
        )}
      </SideSection>

      {outlet.similar.length > 0 && (
        <SideSection
          title="Podoben izbor zgodb"
          info="Mediji, ki pišejo o največ istih zgodbah. Odstotek je delež skupnih zgodb med medijema."
        >
          <ul className="flex flex-col gap-1">
            {outlet.similar.map((s) =>
              related[s.key] ? (
                <li key={s.key}>
                  <OutletRow
                    outlet={related[s.key]}
                    note={formatPercent(s.overlap)}
                  />
                </li>
              ) : null,
            )}
          </ul>
        </SideSection>
      )}

      {counterpart && (
        <SideSection
          title="Iste zgodbe z druge strani"
          info="Medij, ocenjen na drugi strani spektra, ki piše o največ istih zgodbah."
        >
          <OutletRow outlet={counterpart} />
        </SideSection>
      )}

      {outlet.owner && (
        <SideSection
          title="Izdajatelj"
          info="Izdajatelj, kot je vpisan v merjenje MOSS."
        >
          <p className="text-primary text-sm font-semibold">{outlet.owner}</p>
          {siblings.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {siblings.map((o) => (
                <li key={o.key}>
                  <OutletRow outlet={o} />
                </li>
              ))}
            </ul>
          )}
        </SideSection>
      )}
    </div>
  );
}
