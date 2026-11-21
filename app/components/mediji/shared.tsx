import { useState, type ReactNode } from "react";
import { href } from "react-router";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ProviderImage } from "~/components/provider-image";
import { isCategoryKey, getCategory } from "~/config";
import { BiasRatingKey, type BiasRating } from "~/enums/biasRatingKey";
import type { MediaOutlet } from "~/lib/services/mediaLandscape";
import { cn } from "~/lib/utils";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import type { BiasSide } from "~/utils/biasSide";

export const BIAS_ORDER = Object.values(BiasRatingKey) as BiasRating[];

/** Fill for a bias rating inside bars and swatches (brand colours, center outlined). */
export const BIAS_FILL: Record<BiasRating, string> = {
  left: "bg-[#FA2D36]",
  "center-left": "bg-[#FF6166]",
  center: "bg-[#FEFFFF] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]",
  "center-right": "bg-[#52A1FF]",
  right: "bg-[#2D7EFF]",
};

export const SIDE_FILL: Record<BiasSide, string> = {
  left: BIAS_FILL.left,
  center: BIAS_FILL.center,
  right: BIAS_FILL.right,
};

const SIDE_ACCUSATIVE: Record<BiasSide, string> = {
  left: "levega",
  center: "sredinskega",
  right: "desnega",
};

/** "levih", "sredinskih", "desnih" medijev */
export const SIDE_GENITIVE: Record<BiasSide, string> = {
  left: "levih",
  center: "sredinskih",
  right: "desnih",
};

export function formatPercent(share: number, digits = 0) {
  return `${(share * 100).toLocaleString("sl-SI", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })} %`;
}

export function formatPeople(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("sl-SI", { maximumFractionDigits: 1 })} mio.`;
  }
  return `${Math.round(n / 1000).toLocaleString("sl-SI")} tisoč`;
}

function days(n: number) {
  if (n === 1) return "dan";
  if (n === 2) return "dneva";
  if (n <= 4) return "dnevi";
  return "dni";
}

/** Median delay after the first outlet published the same story. */
export function formatLag(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 36) {
    const rounded = Math.round(hours * 2) / 2;
    return `${rounded.toLocaleString("sl-SI")} h`;
  }
  const d = Math.round(hours / 24);
  return `${d} ${days(d)}`;
}

/** 1 zgodba, 2 zgodbi, 3–4 zgodbe, 5+ zgodb (genitive plural after "od"). */
export function pluralZgodba(n: number) {
  const mod = n % 100;
  if (mod === 1) return "zgodba";
  if (mod === 2) return "zgodbi";
  if (mod === 3 || mod === 4) return "zgodbe";
  return "zgodb";
}

export function categoryLabel(key: string) {
  if (!isCategoryKey(key)) return key;
  const name = getCategory(key).name.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function outletHref(key: string) {
  return href("/medij/:providerKey", { providerKey: key });
}

export function BiasChip({
  rating,
  className,
}: {
  rating: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap",
        biasKeyToColor(rating ?? ""),
        className,
      )}
    >
      {rating ? biasKeyToLabel(rating) : "brez ocene"}
    </span>
  );
}

export function OutletLogo({
  outlet,
  className,
  ...rest
}: {
  outlet: Pick<MediaOutlet, "key" | "name">;
} & Omit<React.ComponentProps<"img">, "src" | "alt">) {
  return (
    <ProviderImage
      provider={outlet}
      size={160}
      loading="lazy"
      {...rest}
      className={cn(
        "shadow-vidik shrink-0 rounded-md bg-white object-cover",
        className,
      )}
    />
  );
}

export function LimitedDataNote({ className }: { className?: string }) {
  return (
    <span
      title="Članke tega medija trenutno zajemamo le delno, zato so številke nezanesljive."
      className={cn(
        "text-primary/60 inline-flex items-center rounded-md border border-dashed border-current/30 px-1.5 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap",
        className,
      )}
    >
      malo podatkov
    </span>
  );
}

/** Five-part bar of how readers voted, in spectrum order. */
export function VoteBar({
  votes,
  className,
}: {
  votes: MediaOutlet["votes"];
  className?: string;
}) {
  if (votes.total === 0) {
    return (
      <div
        className={cn("bg-primary/8 h-2 w-full rounded-full", className)}
        aria-label="Še ni glasov"
      />
    );
  }
  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-full", className)}
      role="img"
      aria-label={BIAS_ORDER.map(
        (k) => `${biasKeyToLabel(k)}: ${votes.byRating[k]}`,
      ).join(", ")}
    >
      {BIAS_ORDER.map((k) =>
        votes.byRating[k] > 0 ? (
          <span
            key={k}
            className={BIAS_FILL[k]}
            style={{ width: `${(votes.byRating[k] / votes.total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

/** One sentence on whether readers agree with Vidik's rating. */
export function votesVerdict(outlet: MediaOutlet): {
  tone: "agree" | "split" | "disagree" | "few";
  text: string;
} {
  const { votes, side } = outlet;
  if (votes.agreement === null || !side || !votes.readersSide) {
    return {
      tone: "few",
      text:
        votes.total === 0
          ? "Še nihče ni glasoval."
          : `Premalo glasov (${votes.total}) za oceno.`,
    };
  }
  const pct = formatPercent(votes.agreement);
  if (votes.readersSide !== side) {
    return {
      tone: "disagree",
      text: `Bralci ga večinoma vidijo kot ${SIDE_ACCUSATIVE[votes.readersSide]} (le ${pct} se strinja z našo oceno).`,
    };
  }
  if (votes.agreement >= 0.6) {
    return { tone: "agree", text: `${pct} bralcev se strinja z našo oceno.` };
  }
  return {
    tone: "split",
    text: `Bralci so razdeljeni; ${pct} se strinja z našo oceno.`,
  };
}

export function MeterBar({
  value,
  className,
  fillClassName,
}: {
  /** 0..1 */
  value: number;
  className?: string;
  fillClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-primary/8 h-1.5 w-full overflow-hidden rounded-full",
        className,
      )}
    >
      <div
        className={cn("bg-primary/70 h-full rounded-full", fillClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

/** Small (i) that explains a label; opens on hover, focus, or tap. */
export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  // ponytail: controlled so a tap opens it too; Radix tooltips ignore touch.
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Kaj pomeni: ${label}`}
          onClick={() => setOpen((o) => !o)}
          className="text-primary/45 hover:text-primary inline-flex size-4 shrink-0 items-center justify-center rounded-full"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-64 text-left text-xs leading-snug"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
