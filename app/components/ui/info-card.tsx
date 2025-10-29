import { cn } from "~/lib/utils";

export function InfoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-foreground dark:bg-primary/5 border-primary/10 rounded-lg border p-4 shadow-xs sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
