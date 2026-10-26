import { Link } from "react-router";
import { useState } from "react";
import checkRing from "~/assets/utrinki/check-ring.svg";
import logoNoText from "~/assets/logo-no-text.svg";
import {
  CategoryRail,
  ReelChrome,
  ReelProgress,
} from "~/components/utrinki/chrome";
import type { UtrinkiCategory } from "~/lib/utrinki/model";

export function EndCard({
  category,
  pendingCategory,
  draft = false,
  progressCount,
  imageUrl,
  hasMore,
  loading,
  onOlder,
  onFirst,
}: {
  category: UtrinkiCategory;
  pendingCategory?: UtrinkiCategory | null;
  draft?: boolean;
  progressCount: number;
  imageUrl: string | null;
  hasMore: boolean;
  loading: boolean;
  onOlder: () => void;
  onFirst: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section
      className="relative flex h-dvh snap-start snap-always flex-col overflow-hidden bg-[#1f1f1f] text-[#f3f8fe]"
      aria-label="Konec sklopa"
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[#111318]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[rgba(17,19,24,0.86)]" />
      <ReelChrome category={category} />
      <div className="relative z-10 pt-3.5">
        <CategoryRail
          category={category}
          pending={pendingCategory}
          draft={draft}
        />
      </div>
      <div className="relative z-10 px-4 pt-3">
        <ReelProgress
          index={progressCount - 1}
          count={progressCount}
          complete
        />
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 text-center">
        <div className="relative grid size-[72px] place-items-center">
          <img src={checkRing} alt="" width={72} height={72} />
          <span className="absolute text-[36px] leading-none font-bold text-[#0084e5]">
            ✓
          </span>
        </div>
        <h2 className="mt-6 text-[28px] font-bold">Vse si pregledal</h2>
        <p className="mt-2 max-w-[20rem] text-[15px] leading-[21px] text-[#f3f8fe]/75">
          Novi sklopi se pojavijo sproti.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0084e5] text-[15px] font-semibold focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Nazaj na Vidik
        </Link>
        {hasMore && (
          <button
            type="button"
            onClick={onOlder}
            disabled={loading}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/30 bg-white/6 text-[15px] font-semibold focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-60"
          >
            {loading ? "Nalagam…" : "Starejši sklopi"}
          </button>
        )}
        <button
          type="button"
          onClick={onFirst}
          className="mt-6 text-[14px] font-semibold text-[#f3f8fe]/80"
        >
          ↑ Nazaj na prvi sklop
        </button>
      </div>
      <img src={logoNoText} alt="" className="sr-only" />
    </section>
  );
}
