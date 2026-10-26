export function UtrinkiSkeleton() {
  return (
    <div
      className="fixed inset-0 z-40 bg-[#111318] text-[#f3f8fe]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex h-dvh w-full max-w-[390px] flex-col bg-[#1f1f1f] px-4 py-4">
        <p className="sr-only">Nalagam utrinke</p>
        <div className="h-[62px]" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className="h-[30px] w-20 rounded-full bg-white/10 motion-safe:animate-pulse"
            />
          ))}
        </div>
        <div className="mt-auto mb-8 space-y-3">
          <span className="block h-3 w-40 rounded bg-[#0084e5]/50 motion-safe:animate-pulse" />
          <span className="block h-8 w-4/5 rounded bg-white/15 motion-safe:animate-pulse" />
          <span className="block h-16 rounded-xl bg-white/10 motion-safe:animate-pulse" />
          <span className="block h-12 rounded-xl bg-[#0084e5]/70 motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
