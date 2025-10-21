import { TriangleAlert } from "lucide-react";
import { cn } from "~/lib/utils";

export function ErrorUI({
  message,
  size = "large",
}: {
  message: string;
  size?: "small" | "large";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center text-center",
        {
          "p-4": size === "small",
          "p-8": size === "large",
        },
      )}
    >
      <div
        className={cn("mb-4 rounded-full bg-red-100 dark:bg-red-900/20", {
          "p-3": size === "small",
          "p-6": size === "large",
        })}
      >
        <TriangleAlert
          className={cn("text-red-600 dark:text-red-500", {
            "size-8": size === "small",
            "size-16": size === "large",
          })}
        />
      </div>
      {size === "large" && (
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Oops! Something went wrong
        </h3>
      )}
      <p
        className={cn("max-w-md text-gray-600 dark:text-gray-400", {
          "text-sm": size === "small",
          "text-base": size === "large",
        })}
      >
        {message}
      </p>
    </div>
  );
}
