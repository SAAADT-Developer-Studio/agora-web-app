import logo from "~/assets/logo.svg";
import logoLight from "~/assets/logo-light.svg";
import { ThemeSwitch } from "~/components/theme-switch";
import Coffee from "~/assets/black-button.png";
import { Link, NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import { formatSlovenianDateTime } from "~/lib/date";
import { Dropdown } from "./dropdown";
import { config } from "~/config";

export function Header() {
  return (
    <header className="bg-secondary sticky top-0 z-10">
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
          <Dropdown />
        </div>
      </div>
      <nav className="bg-foreground border-primary/10 flex w-full justify-center border-b">
        <div className="flex w-[1200px]">
          {config.categories.map((category) => {
            return (
              <NavLink
                to={category.path}
                className={({ isActive, isPending }) =>
                  twMerge(
                    "text-primary/70 hover:text-primary px-4 py-3.5 text-sm font-medium transition-colors",
                    isPending && "animate-pulse",
                    isActive && "text-primary border-primary border-b",
                  )
                }
                key={category.path}
              >
                {category.name}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
