import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  formatSlovenianLongDate,
  formatSlovenianWeekdayDate,
} from "~/lib/date";
import { useClientNow } from "~/components/render-clock";
import { config } from "~/config";
import { Menu } from "lucide-react";
import { ThemeSwitch } from "./theme-switch";
import { cn } from "~/lib/utils";
import { LoadingBar } from "~/components/loading-bar";
import { useLocalStorage } from "~/hooks/use-local-storage";
import {
  SIDE_MENU_VARIANTS,
  SideMenu,
  Wordmark,
  sentenceCase,
  type SideMenuVariant,
} from "~/components/side-menu";

/**
 * Three header designs, switchable from a floating control so they can be
 * compared on the live site. Once one is picked, delete the other two and
 * the floating picker.
 */
const HEADER_VARIANTS = [
  { key: "a", name: "Ena vrstica" },
  { key: "b", name: "Časopis" },
  { key: "c", name: "Kompakt" },
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
/* A. Ena vrstica: one dark bar; categories inline on wide screens and */
/*    as a scrolling strip below on narrow ones.                       */
/* ------------------------------------------------------------------ */
const headerALink = ({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) =>
  cn(
    "relative flex items-center px-3 text-[13px] font-semibold tracking-[0.04em]",
    "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
    isActive
      ? "text-vidikwhite after:bg-vidikwhite"
      : "text-vidikwhite/60 hover:text-vidikwhite after:bg-transparent",
    isPending && "animate-pulse",
  );

function HeaderA({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <div className="bg-header text-vidikwhite">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <MenuButton open={open} onOpen={onOpen} />
        <Wordmark />
        <CategoryNav
          className="hidden h-full min-w-0 flex-1 xl:block [&>div]:h-full"
          linkClassName={headerALink}
        />
        <div className="ml-auto flex items-center xl:ml-0">
          <ThemeSwitch variant="icon" />
        </div>
      </div>
      <CategoryNav
        className="border-vidikwhite/10 h-11 border-t xl:hidden [&>div]:h-full"
        linkClassName={headerALink}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B. Časopis: a light masthead in the page's own colors, wordmark     */
/*    centered over the date, categories in sentence case with the     */
/*    left/center/right bar marking the active one.                    */
/* ------------------------------------------------------------------ */
function MastheadDate() {
  const now = new Date(useClientNow());
  return (
    <span
      className="text-surface-text/60 hidden text-[13px] tabular-nums md:block"
      suppressHydrationWarning
    >
      {sentenceCase(formatSlovenianWeekdayDate(now))}
    </span>
  );
}

function HeaderB({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <div className="bg-surface text-surface-text border-primary/10 border-b">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MenuButton open={open} onOpen={onOpen} />
          <MastheadDate />
        </div>
        <Wordmark className="[&>img]:size-7 [&>span]:text-[27px]" />
        <div className="flex justify-end">
          <ThemeSwitch variant="icon" className="-mr-1.5" />
        </div>
      </div>
      <CategoryNav
        className="border-primary/10 h-11 border-t [&>div]:h-full"
        label={sentenceCase}
        linkClassName={({ isActive, isPending }) =>
          cn(
            "relative flex items-center px-3 text-[15px]",
            "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-opacity",
            "after:bg-[linear-gradient(to_right,var(--color-leftred)_0_33.3%,var(--color-primary)_33.3%_66.6%,var(--color-electricblue)_66.6%)]",
            isActive
              ? "font-semibold after:opacity-100"
              : "text-surface-text/70 hover:text-surface-text after:opacity-0",
            isPending && "animate-pulse",
          )
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* C. Kompakt: today's two rows, tightened. Quiet date, icon theme     */
/*    toggle, menu on the right, active category as a pill.            */
/* ------------------------------------------------------------------ */
function HeaderClock() {
  const now = useClientNow();
  return (
    <span
      className="text-vidikwhite/55 hidden text-[13px] tabular-nums md:block"
      suppressHydrationWarning
    >
      {formatSlovenianLongDate(new Date(now))}
    </span>
  );
}

function HeaderC({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <div className="bg-header text-vidikwhite">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <Wordmark />
        <div className="flex items-center gap-2">
          <HeaderClock />
          <ThemeSwitch variant="icon" className="md:ml-2" />
          <MenuButton open={open} onOpen={onOpen} className="mr-[-6px] ml-0" />
        </div>
      </div>
      <CategoryNav
        className="border-vidikwhite/10 border-t py-2"
        linkClassName={({ isActive, isPending }) =>
          cn(
            "rounded-full px-3 py-1.5 text-[13px] font-semibold tracking-[0.03em]",
            isActive
              ? "bg-vidikwhite text-vidikblack"
              : "text-vidikwhite/65 hover:text-vidikwhite hover:bg-vidikwhite/10",
            isPending && "animate-pulse",
          )
        }
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
    "a",
  );
  const [storedMenu, setMenuVariant] = useLocalStorage<string>(
    "menu-variant",
    "a",
  );
  const variant = pick<HeaderVariant>(HEADER_VARIANTS, storedHeader);
  const menuVariant = pick<SideMenuVariant>(SIDE_MENU_VARIANTS, storedMenu);

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
        {variant === "a" && <HeaderA open={open} onOpen={onOpen} />}
        {variant === "b" && <HeaderB open={open} onOpen={onOpen} />}
        {variant === "c" && <HeaderC open={open} onOpen={onOpen} />}
      </header>
      <SideMenu
        open={open}
        variant={menuVariant}
        onClose={() => setOpen(false)}
      />
      <div className="bg-vidikblack/90 text-vidikwhite fixed right-4 bottom-4 z-[45] flex flex-col gap-0.5 rounded-[22px] p-1 text-[13px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] ring-1 ring-white/10 backdrop-blur">
        <VariantPicker
          label="Glava"
          options={HEADER_VARIANTS}
          value={variant}
          onChange={setVariant}
        />
        <VariantPicker
          label="Meni"
          options={SIDE_MENU_VARIANTS}
          value={menuVariant}
          onChange={setMenuVariant}
        />
      </div>
    </>
  );
}
