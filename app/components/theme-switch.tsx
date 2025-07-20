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
        "peer focus-visible:border-ring focus-visible:ring-ring/50 bg-vidikdarkgray inline-flex h-7 w-10 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onCheckedChange={handleSwitch}
      checked={theme === "light"}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-vidikwhite pointer-events-none flex size-6 items-center justify-center rounded-full ring-0 transition-transform",
          "translate-x-[1px] dark:translate-x-[calc(50%+1px)]",
        )}
      >
        <Moon
          className="fill-vidikblack stroke-vidikblack hidden dark:block"
          size={15}
        />
        <Sun
          className="fill-vidikblack stroke-vidikblack dark:hidden"
          size={15}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
