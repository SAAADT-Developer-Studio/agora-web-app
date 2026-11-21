import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** Content column every non-feed page sits in, so titles line up across navigation. */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-6xl px-1 pt-1 pb-12 md:pt-6", className)}>
      {children}
    </div>
  );
}

/** The one page title style. `before` sits above the title (a date badge); `media` to its left (a logo). */
export function PageHeader({
  title,
  children,
  before,
  media,
}: {
  title: ReactNode;
  /** Lede under the title. */
  children?: ReactNode;
  before?: ReactNode;
  media?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start gap-4 md:mb-10 md:gap-5">
      {media}
      <div className="min-w-0">
        {before}
        <h1 className="text-primary text-[1.9rem] leading-none font-bold tracking-tight md:text-5xl">
          {title}
        </h1>
        {children && (
          <div className="text-primary/70 mt-3 max-w-2xl text-[15px] leading-snug md:text-lg">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
