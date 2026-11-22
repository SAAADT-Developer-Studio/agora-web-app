import { Link } from "react-router";
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
  return (
    <section
      className="bg-surface text-surface-text relative h-full snap-start snap-always overflow-hidden"
      aria-label={empty ? "Ni sklopov" : "Konec sklopa"}
    >
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center">
        {!empty && (
          <div className="relative grid size-[72px] place-items-center">
            <img src={checkRing} alt="" width={72} height={72} />
            <span className="absolute text-[36px] leading-none font-bold text-[#0084e5]">
              ✓
            </span>
          </div>
        )}
        <h2
          className={
            empty ? "text-[28px] font-bold" : "mt-6 text-[28px] font-bold"
          }
        >
          {empty ? "Ni sklopov" : "Vse si pregledal"}
        </h2>
        <p className="mt-2 max-w-[20rem] text-[15px] leading-[21px] text-surface-text/70">
          {empty
            ? "V tej kategoriji trenutno ni sklopov."
            : "Novi sklopi se pojavijo sproti."}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0084e5] text-[15px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-surface-text focus-visible:outline-none"
        >
          Nazaj na Vidik
        </Link>
        {hasMore && !empty && (
          <button
            type="button"
            onClick={onOlder}
            disabled={loading}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border-surface-text/20 bg-surface-text/5 border text-[15px] font-semibold focus-visible:ring-2 focus-visible:ring-surface-text focus-visible:outline-none disabled:opacity-60"
          >
            {loading
              ? "Nalagam…"
              : failed
                ? "Poskusi znova"
                : "Starejši sklopi"}
          </button>
        )}
        {failed && !empty && (
          <p className="mt-2 text-[13px] text-surface-text/60">
            Starejših sklopov ni bilo mogoče naložiti.
          </p>
        )}
        {!empty && (
          <button
            type="button"
            onClick={onFirst}
            className="mt-6 text-[14px] font-semibold text-surface-text/70"
          >
            ↑ Nazaj na prvi sklop
          </button>
        )}
      </div>
    </section>
  );
}
