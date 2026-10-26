import { Link } from "react-router";

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

export function UtrinkiEmpty({ categoryLabel }: { categoryLabel: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#111318] px-6 text-center text-[#f3f8fe]">
      <div className="max-w-sm">
        <h1 className="text-[28px] font-bold">Ni sklopov</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#f3f8fe]/75">
          V izboru {categoryLabel} trenutno ni zgodb. Novi sklopi se pojavijo
          sproti.
        </p>
        <Link
          to="/utrinki"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#0084e5] px-5 text-[15px] font-semibold"
        >
          Prikaži aktualno
        </Link>
      </div>
    </div>
  );
}

export function UtrinkiError() {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#111318] px-6 text-center text-[#f3f8fe]">
      <div className="max-w-sm">
        <h1 className="text-[28px] font-bold">
          Sklopov ni bilo mogoče naložiti
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#f3f8fe]/75">
          Poskusi znova. Vidik medtem ostane na voljo.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0084e5] text-[15px] font-semibold"
          >
            Poskusi znova
          </button>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 text-[15px] font-semibold"
          >
            Nazaj na Vidik
          </Link>
        </div>
      </div>
    </div>
  );
}
