import { Sun, Moon } from "lucide-react";
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "~/lib/utils";
import { useLocalStorage } from "~/hooks/use-local-storage";

export function ThemeSwitch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  console.log("Current theme:", theme);

  const handleSwitch = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    setTheme(newTheme);
  };

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-7 w-10 shrink-0 items-center rounded-full border border-transparent bg-gray-700 shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onCheckedChange={handleSwitch}
      checked={theme === "light"}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none flex size-6 items-center justify-center rounded-full bg-gray-300 ring-0 transition-transform",
          "translate-x-[1px] dark:translate-x-[calc(50%+1px)]",
        )}
      >
        <Moon
          className="hidden fill-gray-900 stroke-gray-900 dark:block"
          size={15}
        />
        <Sun
          className="block fill-gray-900 stroke-gray-900 dark:hidden"
          size={15}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
