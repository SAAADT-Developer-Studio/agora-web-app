import { Link } from "react-router";
import { useState } from "react";
import { config } from "~/config";
import { ThemeSwitch } from "~/components/theme-switch";
import logoNoText from "~/assets/logo-no-text.svg";
import menuIcon from "~/assets/utrinki/menu.svg";
import closeIcon from "~/assets/utrinki/close.svg";
import { cn } from "~/lib/utils";
import { utrinkiCategoryHref, type UtrinkiCategory } from "~/lib/utrinki/model";

const chip =
  "inline-flex h-[30px] shrink-0 items-center justify-center rounded-full border px-3 text-[11px] font-semibold tracking-wide focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";

export function ReelProgress({
  index,
  count,
  complete = false,
}: {
  index: number;
  count: number;
  complete?: boolean;
}) {
  const segments = Math.max(count, 1);
  const current = complete ? segments : Math.min(index + 1, segments);
  return (
    <div
      className="flex h-[3px] gap-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={segments}
      aria-valuenow={current}
      aria-label={
        complete ? "Konec trenutnega sklopa" : `Sklop ${current} od ${segments}`
      }
    >
      {Array.from({ length: segments }, (_, segment) => (
        <span
          key={segment}
          className={cn(
            "h-[3px] min-w-0 flex-1 rounded-[2px]",
            complete || segment === index ? "bg-white" : "bg-white/30",
          )}
        />
      ))}
    </div>
  );
}

export function ReelChrome({ category }: { category: UtrinkiCategory }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className="relative z-20 flex h-[62px] shrink-0 items-center justify-between bg-gradient-to-b from-black/55 to-transparent pt-[env(safe-area-inset-top)] pr-4 pl-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Meni"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid size-11 place-items-center rounded-xl focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            <img src={menuIcon} alt="" width={24} height={24} />
          </button>
          <span className="h-7 w-px bg-[#f3f8fe] opacity-25" aria-hidden />
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            <img src={logoNoText} alt="" className="h-[25px] w-6" />
            <span className="font-sarabun text-[23px] leading-none font-medium text-[#f3f8fe] lowercase">
              vidik
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeSwitch variant="reel" />
          <Link
            to="/mediji"
            className="inline-flex h-[34px] items-center justify-center rounded-lg bg-white px-3 text-[14px] font-semibold text-[#232323] focus-visible:ring-2 focus-visible:ring-[#0084e5] focus-visible:outline-none"
          >
            Mediji
          </Link>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Zapri meni"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            aria-label="Vidik"
            className="absolute top-0 left-0 flex h-full w-[280px] flex-col bg-[#1f1f1f] text-[#f3f8fe] shadow-xl"
          >
            <div className="flex h-[62px] items-center justify-between px-4">
              <span className="font-sarabun text-[20px] lowercase">vidik</span>
              <button
                type="button"
                aria-label="Zapri meni"
                onClick={() => setMenuOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-[#292929]"
              >
                <img src={closeIcon} alt="" width={16} height={16} />
              </button>
            </div>
            <ul className="flex flex-col gap-1 overflow-y-auto p-2">
              {config.navigation.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm font-semibold tracking-wide text-[#f3f8fe]/85 hover:bg-white/10"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      <span className="sr-only">Izbrana kategorija: {category}</span>
    </>
  );
}

export function CategoryRail({
  category,
  pending,
  draft = false,
}: {
  category: UtrinkiCategory;
  pending?: UtrinkiCategory | null;
  draft?: boolean;
}) {
  const chips: { key: UtrinkiCategory; label: string }[] = [
    { key: "aktualno", label: "AKTUALNO" },
    ...config.categories.map((item) => ({ key: item.key, label: item.name })),
  ];
  const active = pending ?? category;
  return (
    <nav
      aria-label="Kategorije utrinkov"
      data-chip-rail
      className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chipItem) => {
        const selected = chipItem.key === active;
        return (
          <Link
            key={chipItem.key}
            to={utrinkiCategoryHref(chipItem.key, draft)}
            preventScrollReset
            aria-current={selected ? "page" : undefined}
            className={cn(
              chip,
              selected
                ? "border-transparent bg-[#0084e5] text-[#f3f8fe]"
                : "border-[#f3f8fe] bg-black/55 text-[#f3f8fe]",
              pending === chipItem.key && "opacity-70",
            )}
          >
            {chipItem.label}
          </Link>
        );
      })}
    </nav>
  );
}
