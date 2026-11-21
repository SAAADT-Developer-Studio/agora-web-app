import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { formatSlovenianWeekdayDate } from "~/lib/date";
import { useClientNow } from "~/components/render-clock";
import { config } from "~/config";
import { cn } from "~/lib/utils";
import { LoadingBar } from "~/components/loading-bar";
import { SideMenu, Wordmark, sentenceCase } from "~/components/side-menu";
import { ThemeSwitch } from "~/components/theme-switch";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function HeaderDate() {
  const now = new Date(useClientNow());
  return (
    <span
      className="text-surface-text/60 hidden text-[13px] tabular-nums md:block"
      // Hydration paints the server render date; the browser date replaces
      // it after mount.
      suppressHydrationWarning
    >
      {sentenceCase(formatSlovenianWeekdayDate(now))}
    </span>
  );
}

/**
 * Category row. On narrow screens it scrolls sideways instead of hiding, and
 * keeps the active category in view. The active category is underlined with
 * the left/center/right bar.
 */
function CategoryNav() {
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
    <nav aria-label="Rubrike" className="border-primary/10 h-11 border-t">
      <div
        ref={ref}
        className="flex h-full overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-24px),transparent)] px-2 [scrollbar-width:none] md:justify-center md:[mask-image:none] [&::-webkit-scrollbar]:hidden"
      >
        {config.navigation.map((item) => (
          <NavLink
            to={item.path}
            key={item.path}
            prefetch="intent"
            end
            className={({ isActive, isPending }) =>
              cn(
                "relative flex shrink-0 items-center px-3 text-[15px] text-nowrap transition-colors",
                "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-opacity",
                "after:bg-[linear-gradient(to_right,var(--color-leftred)_0_33.3%,var(--color-primary)_33.3%_66.6%,var(--color-electricblue)_66.6%)]",
                isActive
                  ? "font-semibold after:opacity-100"
                  : "text-surface-text/70 hover:text-surface-text after:opacity-0",
                isPending && "animate-pulse",
              )
            }
          >
            {sentenceCase(item.name)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="bg-surface text-surface-text border-primary/10 sticky top-0 z-30 border-b">
        <LoadingBar />
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            aria-label="Odpri meni"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
            className="-ml-1.5 grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:outline-none"
          >
            <Menu className="size-[22px]" aria-hidden />
          </button>
          <Wordmark />
          <div className="ml-auto flex items-center gap-3">
            <HeaderDate />
            <ThemeSwitch className="-mr-1.5" />
          </div>
        </div>
        <CategoryNav />
      </header>
      <SideMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
