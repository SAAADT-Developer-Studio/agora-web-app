import { cn } from "~/lib/utils";

export function SideCardContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 col-span-1 row-span-2 flex flex-col rounded-md border-1 dark:border-0">
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
