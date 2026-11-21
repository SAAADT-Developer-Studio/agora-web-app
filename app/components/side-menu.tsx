import { useEffect, useRef } from "react";
import { Link, NavLink, href } from "react-router";
import { ArrowRight, Facebook, Instagram, Mail, X } from "lucide-react";
import logoNoText from "~/assets/logo-no-text.svg";
import { XIcon } from "~/components/footer";
import { useClientNow } from "~/components/render-clock";
import { ThemeSwitch } from "~/components/theme-switch";
import { categories } from "~/config";
import { formatSlovenianWeekdayDate } from "~/lib/date";
import { cn } from "~/lib/utils";

/** "TEHNOLOGIJA & ZNANOST" -> "Tehnologija & znanost" */
export function sentenceCase(name: string) {
  const lower = name.toLocaleLowerCase("sl-SI");
  return lower.charAt(0).toLocaleUpperCase("sl-SI") + lower.slice(1);
}

export function Wordmark({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/"
      prefetch="intent"
      onClick={onClick}
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

const MENU_CATEGORIES = [
  { name: "Aktualno", path: "/" },
  ...categories.map((c) => ({ name: sentenceCase(c.name), path: c.path })),
];

const SOCIALS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1BHYtu1oJB/?mibextid=wwXIfr",
    icon: Facebook,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/vidikslo?igsh=MTNnMW1vYXQyYXpvMQ%3D%3D&utm_source=qr",
    icon: Instagram,
  },
  { name: "X", href: "https://x.com/VidikSlo", icon: XIcon },
  { name: "E-pošta", href: "mailto:info@vidik.si", icon: Mail },
];

/** Left to right, the five outlet ratings in their fixed brand colors. */
const SPECTRUM = ["#FA2D36", "#FF6166", "#FEFFFF", "#52A1FF", "#2D7EFF"];

function BiasSpectrum({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-[3px]", className)} aria-hidden>
      {SPECTRUM.map((color) => (
        <span
          key={color}
          className="h-1.5 flex-1 rounded-full ring-1 ring-black/10 ring-inset dark:ring-0"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function useMenuDate() {
  return sentenceCase(formatSlovenianWeekdayDate(new Date(useClientNow())));
}

function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SOCIALS.map(({ name, href: url, icon: Icon }) => (
        <a
          key={name}
          href={url}
          target={url.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer"
          aria-label={name}
          className="text-surface-text/60 hover:text-surface-text hover:bg-primary/5 grid size-9 place-items-center rounded-full transition-colors"
        >
          <Icon size={18} aria-hidden />
        </a>
      ))}
    </div>
  );
}

function MenuFooter() {
  return (
    <div className="border-primary/10 flex shrink-0 items-center justify-between border-t px-3 py-2">
      <SocialLinks />
      <ThemeSwitch variant="icon" className="text-surface-text/70" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Uredniško: no icons, type does the work. Large category names,   */
/*    a small spectrum mark on the active one, Mediji as a headline.   */
/* ------------------------------------------------------------------ */
function ActiveMark() {
  return (
    <span className="flex w-3 shrink-0 flex-col gap-[2px]" aria-hidden>
      <span className="h-[3px] rounded-full bg-[#FA2D36]" />
      <span className="bg-primary h-[3px] rounded-full" />
      <span className="h-[3px] rounded-full bg-[#2D7EFF]" />
    </span>
  );
}

function MenuBody({ onClose }: { onClose: () => void }) {
  const date = useMenuDate();
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p
          className="text-surface-text/55 pt-1 text-[13px]"
          suppressHydrationWarning
        >
          {date}
        </p>

        <nav aria-label="Rubrike v meniju" className="mt-3 flex flex-col">
          {MENU_CATEGORIES.map(({ name, path }) => (
            <NavLink
              to={path}
              key={path}
              end
              prefetch="intent"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "font-sarabun flex items-center gap-2.5 py-[5px] text-[23px] leading-tight tracking-[-0.01em] transition-colors",
                  isActive
                    ? "font-semibold"
                    : "text-surface-text/70 hover:text-surface-text font-medium",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <ActiveMark /> : null}
                  <span>{name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <Link
          to={href("/mediji")}
          prefetch="intent"
          onClick={onClose}
          className="group border-primary/10 mt-6 block border-t pt-5"
        >
          <span className="flex items-baseline justify-between">
            <span className="font-sarabun text-[23px] font-semibold">
              Mediji
            </span>
            <ArrowRight
              className="text-surface-text/50 size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </span>
          <span className="text-surface-text/60 block text-[13px]">
            Od levice do desnice: ocene vseh medijev
          </span>
          <BiasSpectrum className="mt-3" />
        </Link>

        <div className="text-surface-text/65 mt-6 flex flex-col gap-2 text-sm">
          <Link
            to={href("/metodologija")}
            onClick={onClose}
            className="hover:text-surface-text"
          >
            Kako ocenjujemo medije
          </Link>
          <Link
            to={href("/kontakt")}
            onClick={onClose}
            className="hover:text-surface-text"
          >
            Kontakt in podpora
          </Link>
        </div>
      </div>
      <MenuFooter />
    </>
  );
}

export function SideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
          "bg-surface text-surface-text border-primary/10 fixed top-0 left-0 z-40 flex h-full w-[320px] max-w-[88vw] flex-col border-r shadow-[8px_0_32px_rgba(0,0,0,0.18)]",
          "transition-[translate,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between pr-3 pl-5">
          <Wordmark onClick={onClose} />
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
        <MenuBody onClose={onClose} />
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
