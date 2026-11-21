import type { ReactNode } from "react";
import { Link } from "react-router";
import type { MediaOutlet } from "~/lib/services/mediaLandscape";
import { cn } from "~/lib/utils";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import {
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

export type RelatedOutlet = Pick<
  MediaOutlet,
  "key" | "name" | "biasRating" | "owner"
>;

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 border-t border-current/10 py-5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6">
      <dt className="text-primary/60 text-sm font-semibold">{label}</dt>
      <dd className="text-primary min-w-0 text-[15px] leading-snug">
        {children}
      </dd>
    </div>
  );
}

function OutletChip({
  outlet,
  note,
}: {
  outlet: RelatedOutlet;
  note?: string;
}) {
  return (
    <Link
      to={outletHref(outlet.key)}
      prefetch="intent"
      className="hover:bg-primary/5 flex w-fit items-center gap-2 rounded-lg border border-current/10 py-1 pr-2.5 pl-1 transition-colors"
    >
      <OutletLogo outlet={outlet} className="size-7" />
      <span className="text-sm font-semibold">{outlet.name}</span>
      {note && (
        <span className="text-primary/55 text-xs tabular-nums">{note}</span>
      )}
    </Link>
  );
}

/** Everything we know about one outlet, as label/value rows. `voting` renders under the reader verdict. */
export function OutletProfile({
  outlet,
  related,
  bigStoriesTotal,
  windowDays,
  voting,
}: {
  outlet: MediaOutlet;
  related: Record<string, RelatedOutlet>;
  bigStoriesTotal: number;
  windowDays: number;
  voting?: ReactNode;
}) {
  const verdict = votesVerdict(outlet);
  const counterpart = outlet.counterpart && related[outlet.counterpart.key];
  const siblings = Object.values(related).filter(
    (o) => o.owner === outlet.owner && o.key !== outlet.key,
  );

  return (
    <dl>
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
              Povprečen obisk traja {outlet.reach.avgSessionDuration} min. Vir:
              MOSS.
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
          {outlet.votes.total > 0 && (
            <span className="text-primary/55 text-sm font-normal">
              {" "}
              ({outlet.votes.total} glasov)
            </span>
          )}
        </p>
        {voting}
      </Fact>

      <Fact label="Glavne zgodbe">
        <div className="flex max-w-sm items-center gap-3">
          <MeterBar
            value={
              bigStoriesTotal ? outlet.bigStoriesCovered / bigStoriesTotal : 0
            }
            className="h-2"
          />
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {outlet.bigStoriesCovered} / {bigStoriesTotal}
          </span>
        </div>
        <p className="text-primary/60 mt-1.5 text-sm">
          Zgodbe, o katerih je v zadnjih {windowDays} dneh pisalo vsaj pet
          medijev.
        </p>
      </Fact>

      <Fact label="Hitrost">
        {outlet.medianLagMinutes !== null ? (
          <p>
            Prvi objavi pri{" "}
            <strong className="tabular-nums">
              {formatPercent(outlet.firstShare)}
            </strong>{" "}
            skupnih zgodb. Sicer običajno{" "}
            <strong className="tabular-nums">
              {formatLag(outlet.medianLagMinutes)}
            </strong>{" "}
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

      {outlet.topCategories.length > 0 && (
        <Fact label="O čem piše">
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
        </Fact>
      )}

      {outlet.similar.length > 0 && (
        <Fact label="Podoben izbor zgodb">
          <div className="flex flex-wrap gap-2">
            {outlet.similar.map((s) =>
              related[s.key] ? (
                <OutletChip
                  key={s.key}
                  outlet={related[s.key]}
                  note={formatPercent(s.overlap)}
                />
              ) : null,
            )}
          </div>
          <p className="text-primary/55 mt-2 text-xs">
            Delež skupnih zgodb med medijema.
          </p>
        </Fact>
      )}

      {counterpart && (
        <Fact label="Iste zgodbe z druge strani">
          <OutletChip
            outlet={counterpart}
            note={biasKeyToLabel(counterpart.biasRating ?? "")}
          />
        </Fact>
      )}

      {outlet.owner && (
        <Fact label="Izdajatelj">
          <p>{outlet.owner}</p>
          {siblings.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {siblings.map((o) => (
                <OutletChip key={o.key} outlet={o} />
              ))}
            </div>
          )}
          <p className="text-primary/55 mt-2 text-xs">
            Izdajatelj, kot je vpisan v MOSS.
          </p>
        </Fact>
      )}
    </dl>
  );
}

function AgendaScale({ value }: { value: number }) {
  return (
    <div className="max-w-sm">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#FA2D36]/60 via-current/10 to-[#2D7EFF]/60">
        <span className="bg-primary/40 absolute top-1/2 left-1/2 h-3.5 w-px -translate-y-1/2" />
        <span
          className="bg-primary ring-surface absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
          style={{ left: `${((value + 1) / 2) * 100}%` }}
        />
      </div>
      <div className="text-primary/55 mt-1.5 flex justify-between text-xs">
        <span>kot levi mediji</span>
        <span>povprečje</span>
        <span>kot desni mediji</span>
      </div>
    </div>
  );
}
