import { Pointer } from "lucide-react";

/** One swipe lasts this long; the hint plays it three times. */
export const SWIPE_HINT_CYCLE_MS = 1600;
export const SWIPE_HINT_CYCLES = 3;

/**
 * First-visit hint over the reel: a finger swiping up. It lets touches through,
 * so the user's first real swipe both scrolls and closes it (see the feed). With reduced motion it shows the finger still and names the
 * arrow key instead.
 */
export function SwipeHint({ reduced }: { reduced: boolean }) {
  const play = `${SWIPE_HINT_CYCLE_MS}ms cubic-bezier(0.45,0,0.2,1) ${SWIPE_HINT_CYCLES} both`;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-start bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55),rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.15))] pt-[16dvh] motion-safe:animate-in motion-safe:fade-in"
      role="status"
    >
      <div className="relative h-56 w-28" aria-hidden>
        {!reduced && (
          <span
            className="absolute top-8 bottom-14 left-1/2 w-2 -translate-x-1/2 origin-bottom rounded-full bg-gradient-to-t from-white/0 via-white/70 to-white/0"
            style={{ animation: `reel-swipe-trail ${play}` }}
          />
        )}
        <span
          className="absolute top-1/2 left-1/2 -mt-6 -ml-7 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          style={reduced ? undefined : { animation: `reel-swipe-finger ${play}` }}
        >
          <Pointer
            size={72}
            strokeWidth={1.6}
            className="fill-white text-[#0b0d11]"
          />
        </span>
      </div>
      <p className="mt-3 rounded-full bg-black/60 px-5 py-2.5 text-center text-[16px] leading-tight font-bold text-white ring-1 ring-white/15 backdrop-blur-md">
        {reduced ? "Puščica navzdol za naprej" : "Povleci navzgor"}
        <span className="block text-[13px] font-semibold text-white/70">
          za naslednjo novico
        </span>
      </p>
    </div>
  );
}
