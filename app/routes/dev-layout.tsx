import { Outlet } from "react-router";
import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/dev-layout";

export default function DevLayout({}: Route.ComponentProps) {
  return (
    <div className="bg-surface text-surface-text min-h-screen">
      <div className="flex items-center gap-3 border-b border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-amber-800 dark:text-amber-300">
        <span className="rounded bg-amber-500 px-1.5 py-0.5 tracking-normal text-black">
          DEV
        </span>
        <span className="opacity-80">not indexed · no production chrome</span>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
