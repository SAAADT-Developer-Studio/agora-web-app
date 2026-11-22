export function UtrinkiSkeleton() {
  return (
    <div
      className="bg-surface text-surface-text min-h-0 flex-1"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
        <p className="sr-only">Nalagam utrinke</p>
        <div className="bg-surface-text/[0.07] mx-3 mt-3 min-h-0 flex-1 rounded-2xl motion-safe:animate-pulse" />
        <div className="space-y-3 px-4 pt-3 pb-6">
          <span className="block h-3 w-40 rounded bg-[#0084e5]/50 motion-safe:animate-pulse" />
          <span className="block h-8 w-4/5 rounded bg-surface-text/15 motion-safe:animate-pulse" />
          <span className="block h-5 w-3/5 rounded bg-surface-text/10 motion-safe:animate-pulse" />
          <span className="block h-12 rounded-xl bg-[#0084e5]/70 motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
