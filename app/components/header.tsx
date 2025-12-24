import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, useNavigation, href } from "react-router";
import { formatSlovenianDateTime } from "~/lib/date";
import { config } from "~/config";
import { Menu, X } from "lucide-react";
import { useLoadingIndicator } from "~/hooks/use-loading-indicator";
import logo from "~/assets/logo.svg";
import logoLight from "~/assets/logo-light.svg";
import logoNoText from "~/assets/logo-no-text.svg";
import { ThemeSwitch } from "./theme-switch";
import { cn } from "~/lib/utils";

const SIDEPANEL_WIDTH = 280;

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
    <header className="bg-surface-dark sticky top-0 z-30">
      <LoadingBar />
      <div className="flex h-[62px] items-center justify-between pr-4 pl-6 sm:pr-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="hover:bg-primary/10 focus:ring-primary/40 inline-flex items-center justify-center rounded-xl p-1 focus:ring-2 focus:outline-none sm:p-2 xl:hidden"
          >
            <Menu className="h-6 w-6" color="var(--color-vidikwhite)" />
          </button>
          <div className="bg-vidikwhite h-10 w-[1px] opacity-30 xl:hidden" />
          <Link to="/" prefetch="intent">
            <div className="flex items-center gap-[5px]">
              <img src={logoNoText} alt="logo" className="h-6 w-6" />
              <h1 className="font-sarabun text-vidikwhite text-[23px] font-medium tracking-wide lowercase">
                Vidik
              </h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-vidikwhite hidden text-xs md:block">
            <Suspense>{formatSlovenianDateTime(new Date())}</Suspense>
          </span>
          <ThemeSwitch />
          <Link
            to={href("/mediji")}
            className="bg-vidikwhite dark:text-vidikdarkgray hover:bg-vidikwhite/90 text-md rounded-lg px-3 py-1 font-medium text-black"
            prefetch="intent"
          >
            Mediji
          </Link>
        </div>
      </div>

      <nav className="dark:bg-foreground border-primary/10 hidden w-full justify-center border-b bg-white xl:flex">
        <div className="flex overflow-hidden">
          {config.navigation.map((item) => (
            <NavLink
              to={item.path}
              key={item.path}
              prefetch="intent"
              end
              className={({ isActive, isPending }) =>
                cn(
                  "text-primary/70 hover:text-primary px-4 py-3.5 text-sm font-medium text-nowrap transition-colors",
                  isPending && "border-primary/30 animate-pulse border-b",
                  isActive && "text-primary border-primary border-b",
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <aside
        aria-hidden={!open}
        className={cn(
          "bg-foreground border-primary/10 fixed top-0 left-0 z-40 h-full w-[280px] border-r xl:hidden",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ width: SIDEPANEL_WIDTH }}
      >
        <div className="flex h-[62px] items-center justify-between px-4">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="logo" className="hidden h-6 w-20 dark:block" />
            <img
              src={logoLight}
              alt="logo"
              className="block h-6 w-20 dark:hidden"
            />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="hover:bg-primary/10 focus:ring-primary/40 inline-flex items-center justify-center rounded-xl p-2 focus:ring-2 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="border-primary/10 border-b" />

        <nav className="p-2">
          {config.navigation.map((item) => (
            <NavLink
              to={item.path}
              key={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-primary/80 hover:text-primary hover:bg-primary/5",
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <button
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm xl:hidden",
          "transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
    </header>
  );
}

function LoadingBar({
  height = 3,
  color = "repeating-linear-gradient(to right, #00dc82 0%, #34cdfe 50%, #0047e1 100%)",
}: {
  height?: number;
  color?: string;
}) {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const { progress, start, finish, isLoading } = useLoadingIndicator();

  useEffect(() => {
    if (isNavigating) {
      start({ force: true });
    } else {
      finish();
    }
  }, [isNavigating, start, finish]);

  return (
    <div
      role="progressbar"
      aria-hidden={!isLoading}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        pointerEvents: "none",
        width: "auto",
        height: `${height}px`,
        opacity: isLoading ? 1 : 0,
        background: color,
        backgroundSize: `${progress > 0 ? (100 / progress) * 100 : 0}% auto`,
        transform: `scaleX(${progress / 100})`,
        transformOrigin: "left",
        transition: "transform 0.1s, height 0.4s, opacity 0.4s",
        zIndex: 999999,
      }}
    />
  );
}
