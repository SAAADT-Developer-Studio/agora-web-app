import { useState } from "react";
import { Grip } from "lucide-react";
import logo from "~/assets/logo.svg";
import logoLight from "~/assets/logo-light.svg";
import { ThemeSwitch } from "~/components/theme-switch";
import Coffee from "~/assets/black-button.png";
import { Dropdown } from "./ui/dropdown";
import { Link, NavLink } from "react-router";
import { twMerge } from "tailwind-merge";

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
    <header className="bg-primary">
      <div className="flex h-[58px] items-center justify-between px-4 py-8">
        <img src={logo} alt="logo" className="hidden h-6 w-20 dark:block" />
        <img src={logoLight} alt="logo" className="h-6 w-20 dark:hidden" />
        <div className="flex items-center gap-3">
          <img src={Coffee} alt="coffee" className="h-8" />
          <ThemeSwitch />
          <button onClick={() => setOpen((prev) => !prev)}>
            <Grip size={28} />
          </button>
          <Dropdown open={open} onClose={() => setOpen(false)} />
        </div>
      </div>
      <div className="bg-secondary flex justify-center px-6 py-4">
        <div className="flex w-[1200px] gap-8">
          {CATEGORIES.map((category) => {
            return (
              <NavLink
                to={category.path}
                className={({ isActive, isPending }) =>
                  twMerge(
                    "p-sm-regular hover:text-white",
                    isActive && "text-white",
                    isPending && "animate-pulse",
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
