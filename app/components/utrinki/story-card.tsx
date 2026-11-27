import { Link } from "react-router";
import { ArrowRight, Bookmark, EyeOff, Share } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import logoNoText from "~/assets/logo-no-text.svg";
import { ProviderStack } from "~/components/utrinki/provider-mark";
import { useClientNow } from "~/components/render-clock";
import { shortAgo, storyHook, type UtrinkiStory } from "~/lib/utrinki/model";

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className="text-surface-text bg-surface-text/[0.07] hover:bg-surface-text/[0.12] focus-visible:ring-surface-text grid size-12 shrink-0 place-items-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

/**
 * Article photos in carousel order. Same Embla setup as `HeroImageCarousel`
 * on the story page (`app/components/story-page.tsx`): loop, touch swipe, and
 * mouse drag. `touch-pan-y` leaves vertical pans to the reel.
 */
function StoryImageCarousel({
  urls,
  storyPath,
  near,
  onOpenStory,
  onImageError,
}: {
  urls: readonly string[];
  storyPath: UtrinkiStory["storyPath"];
  near: boolean;
  onOpenStory: () => void;
  onImageError: (url: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (!emblaApi) return undefined;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="absolute inset-0">
      <div
        ref={emblaRef}
        className="h-full cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <div className="flex h-full touch-pan-y">
          {urls.map((url, index) => (
            <Link
              key={`${index}:${url}`}
              to={storyPath}
              tabIndex={-1}
              aria-hidden
              onClick={onOpenStory}
              className="relative block h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={url}
                alt=""
                draggable={false}
                loading={near ? "eager" : "lazy"}
                onError={() => onImageError(url)}
                className="size-full touch-pan-y object-cover object-[50%_35%] select-none"
              />
            </Link>
          ))}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10 flex gap-1 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm">
        {urls.map((url, index) => (
          <button
            key={`${index}:${url}`}
            type="button"
            aria-label={`Slika ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full bg-white transition-all",
              index === currentIndex ? "w-4" : "w-1.5 opacity-50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

const hookTone = {
  left: "bg-[#ff706f]",
  right: "bg-[#0084e5]",
  neutral:
    "bg-[linear-gradient(to_right,#ff706f_0_33%,#bdbdbd_33%_66%,#0084e5_66%)]",
} as const;

export function StoryCard({
  story,
  saved,
  near = true,
  onOpenSources,
  onToggleSave,
  onShare,
  onOpenStory,
  onHide,
}: {
  story: UtrinkiStory;
  saved: boolean;
  /** Within one card of the active one: load images eagerly. */
  near?: boolean;
  onOpenSources: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenStory: () => void;
  onHide: () => void;
}) {
  const now = useClientNow();
  const hook = storyHook(story.bias, story.providerCount);
  const candidates =
    story.imageCandidates?.length > 0
      ? story.imageCandidates
      : story.imageUrl
        ? [story.imageUrl]
        : [];
  const candidateKey = candidates.join("|");
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    setFailed(new Set());
  }, [candidateKey]);
  const slides = candidates.filter((url) => !failed.has(url));
  const onImageError = (url: string) => {
    setFailed((current) => {
      if (current.has(url)) return current;
      const next = new Set(current);
      next.add(url);
      return next;
    });
  };
  return (
    <article
      className="bg-surface text-surface-text relative flex h-full snap-start snap-always flex-col overflow-hidden"
      aria-labelledby={`utrinki-title-${story.id}`}
    >
      <div className="bg-surface-text/[0.06] relative mx-3 mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl shadow-[0_12px_28px_-14px_rgba(0,0,0,0.45)]">
        {slides.length > 1 ? (
          <StoryImageCarousel
            urls={slides}
            storyPath={story.storyPath}
            near={near}
            onOpenStory={onOpenStory}
            onImageError={onImageError}
          />
        ) : (
          <Link
            to={story.storyPath}
            onClick={onOpenStory}
            tabIndex={-1}
            aria-hidden
            className="absolute inset-0 block"
          >
            {slides[0] ? (
              <img
                key={slides[0]}
                src={slides[0]}
                alt=""
                loading={near ? "eager" : "lazy"}
                onError={() => onImageError(slides[0])}
                className="motion-safe:animate-in motion-safe:fade-in size-full object-cover object-[50%_35%]"
              />
            ) : (
              <span className="grid size-full place-items-center">
                <img src={logoNoText} alt="" className="h-16 w-16 opacity-40" />
                <span className="sr-only">Brez fotografije</span>
              </span>
            )}
          </Link>
        )}
      </div>
      <div
        className="relative shrink-0 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]"
        onPointerDown={(event) => {
          if (!(event.target instanceof HTMLElement)) return;
          if (event.target.closest("button, a")) return;
          const timer = window.setTimeout(onHide, 500);
          const clear = () => {
            window.clearTimeout(timer);
            window.removeEventListener("pointerup", clear);
            window.removeEventListener("pointercancel", clear);
          };
          window.addEventListener("pointerup", clear);
          window.addEventListener("pointercancel", clear);
        }}
      >
        <p className="flex items-center gap-2" suppressHydrationWarning>
          <span className="rounded-md bg-[#0084e5] px-2 py-0.5 text-[11px] leading-4 font-extrabold tracking-[0.6px] text-white uppercase">
            {story.categoryLabel}
          </span>
          <span className="text-surface-text/60 text-[12px] font-semibold">
            {shortAgo(story.updatedAt, now)}
          </span>
        </p>
        <h2
          id={`utrinki-title-${story.id}`}
          className="mt-1.5 text-[26px] leading-[30px] font-bold text-balance first-letter:uppercase"
        >
          {/* The link is the block that holds the text, so first-letter and
              line-clamp apply to the headline itself. */}
          <Link
            to={story.storyPath}
            onClick={onOpenStory}
            className="line-clamp-3 block first-letter:uppercase"
          >
            {story.title}
          </Link>
        </h2>
        {hook && (
          <p className="text-surface-text/85 mt-2 flex items-center gap-2 text-[15px] leading-5 font-semibold">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                hookTone[hook.tone],
              )}
              aria-hidden
            />
            {hook.text}
          </p>
        )}
        <button
          type="button"
          onClick={onOpenSources}
          aria-label={`Viri: ${story.coverageLabel}. Primerjaj poročanje`}
          className="focus-visible:ring-surface-text mt-3 block w-full rounded-xl py-1 text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex items-center gap-3">
            <ProviderStack
              providers={story.providers}
              total={story.providerCount}
            />
            <span className="text-surface-text/70 min-w-0 flex-1 truncate text-[13px] font-semibold">
              {story.coverageLabel}
            </span>
          </span>
          <BiasBar bias={story.bias} className="mt-2.5" adaptive />
        </button>
        <div className="mt-3 flex gap-2">
          <Link
            to={story.storyPath}
            onClick={onOpenStory}
            data-story-cta
            className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0084e5] text-[16px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(0,132,229,0.7)] transition-colors hover:bg-[#1a92ec] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <span className="truncate">Poglej vse vidike</span>
            <ArrowRight size={18} aria-hidden className="shrink-0" />
          </Link>
          <IconButton
            label={saved ? "Odstrani iz shranjenih" : "Shrani"}
            pressed={saved}
            onClick={onToggleSave}
          >
            <Bookmark
              size={20}
              fill={saved ? "currentColor" : "none"}
              aria-hidden
            />
          </IconButton>
          <IconButton label="Deli" onClick={onShare}>
            <Share size={20} aria-hidden />
          </IconButton>
          <IconButton label="Skrij sklop" onClick={onHide}>
            <EyeOff size={20} aria-hidden />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

export function BiasBar({
  bias,
  className = "",
  adaptive = false,
}: {
  bias: UtrinkiStory["bias"];
  className?: string;
  /** Follow the site theme instead of assuming a dark backdrop. */
  adaptive?: boolean;
}) {
  const rated = bias.left + bias.center + bias.right;
  if (rated === 0) {
    return (
      <p
        className={cn(
          "text-[11px] font-semibold",
          adaptive ? "text-surface-text/60" : "text-[#f3f8fe]/70",
          className,
        )}
      >
        Viri so neopredeljeni
      </p>
    );
  }
  const parts = [
    {
      key: "left",
      label: "LEVO",
      percent: bias.leftPercent,
      color: "bg-[#ff706f]",
      text: adaptive ? "text-[#e0524f] dark:text-[#ff706f]" : "text-[#ff706f]",
    },
    {
      key: "center",
      label: "CENTER",
      percent: bias.centerPercent,
      color: adaptive ? "bg-[#cfcfcf] dark:bg-white" : "bg-white",
      text: adaptive ? "text-surface-text" : "text-[#f3f8fe]",
    },
    {
      key: "right",
      label: "DESNO",
      percent: bias.rightPercent,
      color: "bg-[#0084e5]",
      text: adaptive ? "text-[#0074cc] dark:text-[#4aa8ff]" : "text-[#0084e5]",
    },
  ] as const;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2 text-[11px] leading-[14px] font-semibold">
        {parts.map((part) => (
          <span
            key={part.key}
            className={cn(
              part.text,
              part.key === "center" && "text-center",
              part.key === "right" && "text-right",
            )}
          >
            {part.label} {part.percent} %
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {parts.map((part) =>
          part.percent > 0 ? (
            <span
              key={part.key}
              className={`${part.color} h-1.5`}
              style={{ width: `${part.percent}%` }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
