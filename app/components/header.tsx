import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, href, useLocation } from "react-router";
import {
  formatSlovenianLongDate,
  formatSlovenianWeekdayDate,
} from "~/lib/date";
import { useClientNow } from "~/components/render-clock";
import { config } from "~/config";
import { ChevronRight, Menu, X } from "lucide-react";
import logoNoText from "~/assets/logo-no-text.svg";
import { ThemeSwitch } from "./theme-switch";
import { cn } from "~/lib/utils";
import { LoadingBar } from "~/components/loading-bar";
import { useLocalStorage } from "~/hooks/use-local-storage";

/**
 * Three header designs, switchable from a floating control so they can be
 * compared on the live site. Once one is picked, delete the other two and
 * `HeaderVariantSwitcher`.
 */
const HEADER_VARIANTS = [
  { key: "a", name: "Ena vrstica" },
  { key: "b", name: "Časopis" },
  { key: "c", name: "Kompakt" },
] as const;
type HeaderVariant = (typeof HEADER_VARIANTS)[number]["key"];

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** "TEHNOLOGIJA & ZNANOST" -> "Tehnologija & znanost" */
function sentenceCase(name: string) {
  const lower = name.toLocaleLowerCase("sl-SI");
  return lower.charAt(0).toLocaleUpperCase("sl-SI") + lower.slice(1);
}

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      prefetch="intent"
      aria-label="Vidik, domača stran"
      className={cn("flex shrink-0 items-center gap-[5px]", className)}
    >
      <img src={logoNoText} alt="" className="size-6" />
      <span className="font-sarabun text-[23px] leading-none font-medium tracking-wide lowercase">
        Vidik
      </span>
    </Link>
  );
}

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

const SITE_LINKS = [
  {
    to: href("/mediji"),
    name: "Mediji",
    description: "Ocene pristranskosti vseh medijev",
  },
  {
    to: href("/metodologija"),
    name: "Metodologija",
    description: "Kako ocenjujemo medije",
  },
  { to: href("/kontakt"), name: "Kontakt", description: "Pišite nam" },
];

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <>
      <aside
        id="site-menu"
        aria-label="Meni"
        inert={!open}
        className={cn(
          "bg-surface text-surface-text border-primary/10 fixed top-0 left-0 z-40 flex h-full w-[300px] max-w-[85vw] flex-col border-r",
          "transition-[translate,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between pr-3 pl-5">
          <Wordmark />
          <button
            ref={closeRef}
            type="button"
            aria-label="Zapri meni"
            onClick={onClose}
            className="hover:bg-primary/10 focus-visible:ring-primary/40 grid size-9 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-6">
          <p className="text-surface-text/55 px-2 pb-1.5 text-xs font-semibold">
            Rubrike
          </p>
          <nav aria-label="Rubrike v meniju">
            {config.navigation.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                end
                prefetch="intent"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-2 py-2 text-[15px] transition-colors",
                    isActive
                      ? "bg-primary/[0.07] font-semibold"
                      : "text-surface-text/85 hover:bg-primary/5 hover:text-surface-text",
                  )
                }
              >
                {sentenceCase(item.name)}
              </NavLink>
            ))}
          </nav>

          <div className="border-primary/10 mx-2 my-4 border-t" />

          <p className="text-surface-text/55 px-2 pb-1.5 text-xs font-semibold">
            O Vidiku
          </p>
          <nav aria-label="O Vidiku">
            {SITE_LINKS.map((item) => (
              <NavLink
                to={item.to}
                key={item.to}
                prefetch="intent"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors",
                    isActive ? "bg-primary/[0.07]" : "hover:bg-primary/5",
                  )
                }
              >
                <span>
                  <span className="block text-[15px] font-medium">
                    {item.name}
                  </span>
                  <span className="text-surface-text/60 block text-[13px]">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  className="text-surface-text/35 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
    </>
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

function HeaderVariantSwitcher({
  value,
  onChange,
}: {
  value: HeaderVariant;
  onChange: (v: HeaderVariant) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Različica glave"
      className="bg-vidikblack/90 text-vidikwhite fixed bottom-4 left-4 z-[35] flex items-center gap-1 rounded-full p-1 pl-3 text-[13px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] ring-1 ring-white/10 backdrop-blur"
    >
      <span className="pr-1 text-white/60">Glava</span>
      {HEADER_VARIANTS.map((v) => (
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

export function Header() {
  const [open, setOpen] = useState(false);
  const [stored, setVariant] = useLocalStorage<HeaderVariant>(
    "header-variant",
    "a",
  );
  const variant: HeaderVariant = HEADER_VARIANTS.some((v) => v.key === stored)
    ? stored
    : "a";

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
      <SideMenu open={open} onClose={() => setOpen(false)} />
      <HeaderVariantSwitcher value={variant} onChange={setVariant} />
    </>
  );
}
