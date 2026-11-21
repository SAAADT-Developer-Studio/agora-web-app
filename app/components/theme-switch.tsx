import { Moon, Sun } from "lucide-react";

import { cn } from "~/lib/utils";
import { useLocalStorage } from "~/hooks/use-local-storage";

/** Round icon button that flips light/dark and inherits the text color. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const dark = theme === "dark";

  const handleSwitch = () => {
    const newTheme = dark ? "light" : "dark";
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={dark ? "Preklopi na svetlo temo" : "Preklopi na temno temo"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:outline-none",
        className,
      )}
    >
      {dark ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
    </button>
  );
}
