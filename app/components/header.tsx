import { useState } from "react";
import { Grip } from "lucide-react";
import logo from "~/assets/logo.svg";
import logoLight from "~/assets/logo-light.svg";
import { ThemeSwitch } from "~/components/theme-switch";
import Coffee from "~/assets/black-button.png";
import { Link, NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import { formatSlovenianDateTime } from "~/lib/date";
import { Dropdown } from "./dropdown";

const CATEGORIES: { name: string; path: string }[] = [
  { name: "AKTUALNO", path: "/" },
  { name: "POLITIKA", path: "/politika" },
  { name: "GOSPODARSTVO", path: "/gospodarstvo" },
  { name: "KRIMINAL", path: "/kriminal" },
  { name: "ŠPORT", path: "/sport" },
  { name: "KULTURA", path: "/kultura" },
  { name: "ZDRAVJE", path: "/zdravje" },
  { name: "OKOLJE", path: "/okolje" },
  { name: "LOKALNO", path: "/lokalno" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-background w-[100svw]">
      <div className="flex h-[62px] items-center justify-between pr-8 pl-6">
        <Link to="/">
          <img src={logo} alt="logo" className="hidden h-6 w-20 dark:block" />
          <img src={logoLight} alt="logo" className="h-6 w-20 dark:hidden" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="mr-3 text-xs">
            {formatSlovenianDateTime(new Date())}
          </span>
          <img src={Coffee} alt="coffee" className="h-8" />
          <ThemeSwitch />
          <button onClick={() => setOpen((prev) => !prev)}>
            <Dropdown />
          </button>
        </div>
      </div>
      <div className="bg-foreground flex w-full justify-center">
        <div className="flex w-[1200px]">
          {CATEGORIES.map((category) => {
            return (
              <NavLink
                to={category.path}
                className={({ isActive, isPending }) =>
                  twMerge(
                    "p-sm text-primary/70 hover:text-primary px-4 py-3.5 transition-colors",
                    isPending && "animate-pulse",
                    isActive && "text-primary border-b",
                  )
                }
                key={category.path}
              >
                {category.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
