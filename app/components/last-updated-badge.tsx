import { cn } from "~/lib/utils";

export function LastUpdatedBadge({
  date,
  className,
}: {
  date: Date;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-primary/10 inline-block rounded px-3 py-1", className)}
    >
      <span className="text-primary text-xs font-medium">
        Nazadnje posodobljeno:{" "}
        {date.toLocaleDateString("sl-SI", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    </div>
  );
}
