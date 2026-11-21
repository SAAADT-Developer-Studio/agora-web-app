import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { formatSlovenianWeekdayDate } from "~/lib/date";
import { useClientNow } from "~/components/render-clock";
import { config } from "~/config";
import { Menu } from "lucide-react";
import { ThemeSwitch } from "./theme-switch";
import { cn } from "~/lib/utils";
import { LoadingBar } from "~/components/loading-bar";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { SideMenu, Wordmark, sentenceCase } from "~/components/side-menu";

/**
 * Three takes on the "Časopis" header, switchable from a floating control so
 * they can be compared on the live site. Once one is picked, delete the other two and
 * the floating picker.
 */
const HEADER_VARIANTS = [
  { key: "b1", name: "Levo" },
  { key: "b2", name: "Naslovnica" },
  { key: "b3", name: "Ena vrstica" },
] as const;
type HeaderVariant = (typeof HEADER_VARIANTS)[number]["key"];

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function MenuButton({
  open,
  onOpen,
  className,
}: {
  open: boolean;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Odpri meni"
      aria-expanded={open}
      aria-controls="site-menu"
      onClick={onOpen}
      className={cn(
        "-ml-1.5 grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:outline-none",
        className,
      )}
    >
      <Menu className="size-[22px]" aria-hidden />
    </button>
  );
}

/**
 * Horizontally scrolling category row. On narrow screens it scrolls instead
 * of hiding, and keeps the active category in view.
 */
function CategoryNav({
  className,
  linkClassName,
  label,
}: {
  className?: string;
  linkClassName: (state: { isActive: boolean; isPending: boolean }) => string;
  label?: (name: string) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useIsomorphicLayoutEffect(() => {
    const scroller = ref.current;
    const active = scroller?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!scroller || !active) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollLeft =
      active.offsetLeft - scroller.clientWidth / 2 + active.offsetWidth / 2;
  }, [pathname]);

  return (
    <nav aria-label="Rubrike" className={className}>
      <div
        ref={ref}
        className="flex overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-24px),transparent)] px-2 [scrollbar-width:none] md:justify-center md:[mask-image:none] [&::-webkit-scrollbar]:hidden"
      >
        {config.navigation.map((item) => (
          <NavLink
            to={item.path}
            key={item.path}
            prefetch="intent"
            end
            className={(state) =>
              cn("shrink-0 text-nowrap transition-colors", linkClassName(state))
            }
          >
            {label ? label(item.name) : item.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* All three keep the "Časopis" category row: light, sentence case, a  */
/* left/center/right bar under the active category. They differ in how */
/* the top row carries the wordmark.                                   */
/* ------------------------------------------------------------------ */
const bLink = ({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) =>
  cn(
    "relative flex items-center px-3 text-[15px]",
    "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-opacity",
    "after:bg-[linear-gradient(to_right,var(--color-leftred)_0_33.3%,var(--color-primary)_33.3%_66.6%,var(--color-electricblue)_66.6%)]",
    isActive
      ? "font-semibold after:opacity-100"
      : "text-surface-text/70 hover:text-surface-text after:opacity-0",
    isPending && "animate-pulse",
  );

function MastheadDate({ className }: { className?: string }) {
  const now = new Date(useClientNow());
  return (
    <span
      className={cn("text-surface-text/60 text-[13px] tabular-nums", className)}
      suppressHydrationWarning
    >
      {sentenceCase(formatSlovenianWeekdayDate(now))}
    </span>
  );
}

type HeaderProps = { open: boolean; onOpen: () => void };

const shell = "bg-surface text-surface-text border-primary/10 border-b";
const navRow = "border-primary/10 h-11 border-t [&>div]:h-full";

/* B1. Levo: wordmark at the left edge next to the menu, the date and   */
/*     theme toggle on the right. The usual reading order for a site.  */
function HeaderB1({ open, onOpen }: HeaderProps) {
  return (
    <div className={shell}>
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-6">
        <MenuButton open={open} onOpen={onOpen} />
        <Wordmark />
        <div className="ml-auto flex items-center gap-3">
          <MastheadDate className="hidden md:block" />
          <ThemeSwitch variant="icon" className="-mr-1.5" />
        </div>
      </div>
      <CategoryNav
        className={navRow}
        label={sentenceCase}
        linkClassName={bLink}
      />
    </div>
  );
}

/* B2. Naslovnica: a real newspaper nameplate. The wordmark is big      */
/*     enough to own the center, with the date set under it, so the    */
/*     row reads as one masthead instead of three loose pieces.        */
function HeaderB2({ open, onOpen }: HeaderProps) {
  return (
    <div className={shell}>
      <div className="mx-auto grid h-14 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-4 md:h-[88px] md:px-6">
        <div>
          <MenuButton open={open} onOpen={onOpen} />
        </div>
        <div className="flex flex-col items-center">
          <Wordmark className="gap-[7px] md:[&>img]:size-[34px] md:[&>span]:text-[38px] md:[&>span]:tracking-[0.01em]" />
          <MastheadDate className="mt-1 hidden md:block" />
        </div>
        <div className="flex justify-end">
          <ThemeSwitch variant="icon" className="-mr-1.5" />
        </div>
      </div>
      <CategoryNav
        className={navRow}
        label={sentenceCase}
        linkClassName={bLink}
      />
    </div>
  );
}

/* B3. Ena vrstica: on wide screens the wordmark, categories and        */
/*     toggles share one row; below xl it falls back to B1.            */
function HeaderB3({ open, onOpen }: HeaderProps) {
  return (
    <div className={shell}>
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:px-6">
        <MenuButton open={open} onOpen={onOpen} />
        <Wordmark />
        <CategoryNav
          className="hidden h-full min-w-0 flex-1 xl:block [&>div]:h-full"
          label={sentenceCase}
          linkClassName={bLink}
        />
        <div className="ml-auto flex items-center gap-3 xl:ml-0">
          <MastheadDate className="hidden md:block xl:hidden" />
          <ThemeSwitch variant="icon" className="-mr-1.5" />
        </div>
      </div>
      <CategoryNav
        className={cn(navRow, "xl:hidden")}
        label={sentenceCase}
        linkClassName={bLink}
      />
    </div>
  );
}

function VariantPicker<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: K; name: string }[];
  value: K;
  onChange: (v: K) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Različica: ${label}`}
      className="flex items-center gap-1"
    >
      <span className="w-12 pl-2 text-white/60">{label}</span>
      {options.map((v) => (
        <button
          key={v.key}
          type="button"
          role="radio"
          aria-checked={value === v.key}
          title={v.name}
          onClick={() => onChange(v.key)}
          className={cn(
            "rounded-full px-3 py-1 font-semibold uppercase transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
            value === v.key
              ? "bg-vidikwhite text-vidikblack"
              : "text-white/75 hover:bg-white/10",
          )}
        >
          {v.key}
          <span className="sr-only"> – {v.name}</span>
        </button>
      ))}
    </div>
  );
}

function pick<K extends string>(
  options: readonly { key: K }[],
  stored: string,
): K {
  return options.find((o) => o.key === stored)?.key ?? options[0].key;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [storedHeader, setVariant] = useLocalStorage<string>(
    "header-variant",
    "b1",
  );
  const variant = pick<HeaderVariant>(HEADER_VARIANTS, storedHeader);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onOpen = () => setOpen(true);

  return (
    <>
      <header className="sticky top-0 z-30">
        <LoadingBar />
        {variant === "b1" && <HeaderB1 open={open} onOpen={onOpen} />}
        {variant === "b2" && <HeaderB2 open={open} onOpen={onOpen} />}
        {variant === "b3" && <HeaderB3 open={open} onOpen={onOpen} />}
      </header>
      <SideMenu open={open} onClose={() => setOpen(false)} />
      <div className="bg-vidikblack/90 text-vidikwhite fixed right-4 bottom-4 z-[45] flex rounded-full p-1 text-[13px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] ring-1 ring-white/10 backdrop-blur">
        <VariantPicker
          label="Glava"
          options={HEADER_VARIANTS}
          value={variant}
          onChange={setVariant}
        />
      </div>
    </>
  );
}
