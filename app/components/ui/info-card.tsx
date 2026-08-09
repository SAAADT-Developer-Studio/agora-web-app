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
        "bg-card text-card-foreground border-border/80 shadow-vidik rounded-xl border p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
