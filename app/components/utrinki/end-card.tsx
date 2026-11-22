import { Link } from "react-router";
import { LoaderCircle } from "lucide-react";
import checkRing from "~/assets/utrinki/check-ring.svg";

export function EndCard({
  hasMore,
  loading,
  failed = false,
  empty = false,
  onOlder,
  onFirst,
}: {
  hasMore: boolean;
  loading: boolean;
  failed?: boolean;
  empty?: boolean;
  onOlder: () => void;
  onFirst: () => void;
}) {
  // More stories are on the way (they load on their own); show progress
  // instead of an ending.
  if (hasMore && !failed && !empty) {
    return (
      <section
        className="bg-surface text-surface-text relative grid h-full snap-start snap-always place-items-center"
        aria-label="Nalagam nove sklope"
        aria-busy={loading}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <LoaderCircle
            className="size-8 text-[#0084e5] motion-safe:animate-spin"
            aria-hidden
          />
          <p className="text-surface-text/70 text-[15px] font-semibold">
            Nalagam nove sklope …
          </p>
        </div>
      </section>
    );
  }

  // The next page failed to load: offer a retry instead of an ending.
  const stalled = hasMore && failed && !empty;
  return (
    <section
      className="bg-surface text-surface-text relative h-full snap-start snap-always overflow-hidden"
      aria-label={empty ? "Ni sklopov" : "Konec sklopa"}
    >
      <div className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center text-center">
        {!empty && !stalled && (
          <div className="relative grid size-[72px] place-items-center">
            <img src={checkRing} alt="" width={72} height={72} />
            <span className="absolute text-[36px] leading-none font-bold text-[#0084e5]">
              ✓
            </span>
          </div>
        )}
        <h2
          className={
            empty || stalled
              ? "text-[28px] font-bold"
              : "mt-6 text-[28px] font-bold"
          }
        >
          {empty
            ? "Ni sklopov"
            : stalled
              ? "Nalaganje ni uspelo"
              : "Vse si pregledal"}
        </h2>
        <p className="text-surface-text/70 mt-2 max-w-[20rem] text-[15px] leading-[21px]">
          {empty
            ? "V tej kategoriji trenutno ni sklopov."
            : stalled
              ? "Starejših sklopov ni bilo mogoče naložiti."
              : "Novi sklopi se pojavijo sproti."}
        </p>
        <Link
          to="/"
          className="focus-visible:ring-surface-text mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0084e5] text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:outline-none"
        >
          Nazaj na Vidik
        </Link>
        {stalled && (
          <button
            type="button"
            onClick={onOlder}
            disabled={loading}
            className="border-surface-text/20 bg-surface-text/5 focus-visible:ring-surface-text mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border text-[15px] font-semibold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
          >
            {loading ? "Nalagam…" : "Poskusi znova"}
          </button>
        )}
        {!empty && (
          <button
            type="button"
            onClick={onFirst}
            className="text-surface-text/70 mt-6 text-[14px] font-semibold"
          >
            ↑ Nazaj na prvi sklop
          </button>
        )}
      </div>
    </section>
  );
}
