import { cn } from "~/lib/utils";

export function SideCardContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border-border/80 shadow-vidik col-span-1 row-span-2 flex flex-col rounded-xl border",
        "dark:border-current/15 dark:border-t-white/20 dark:shadow-none",
      )}
    >
      {children}
    </div>
  );
}

export function SideCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-start gap-2 p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
