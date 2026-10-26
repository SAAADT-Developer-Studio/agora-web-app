import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import logoNoText from "~/assets/logo-no-text.svg";
import sourcesIcon from "~/assets/utrinki/sources.svg";
import shareIcon from "~/assets/utrinki/share.svg";
import arrowIcon from "~/assets/utrinki/arrow.svg";
import {
  CategoryRail,
  ReelChrome,
  ReelProgress,
} from "~/components/utrinki/chrome";
import { ProviderStack } from "~/components/utrinki/provider-mark";
import {
  updatedKicker,
  type UtrinkiCategory,
  type UtrinkiStory,
} from "~/lib/utrinki/model";

function ActionButton({
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
      className="grid size-12 place-items-center rounded-full border border-[#494949] bg-[#1f1f1f] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

export function StoryCard({
  story,
  category,
  pendingCategory,
  draft = false,
  progressIndex,
  progressCount,
  saved,
  onOpenSources,
  onOpenSaved,
  onToggleSave,
  onShare,
  onOpenStory,
}: {
  story: UtrinkiStory;
  category: UtrinkiCategory;
  pendingCategory?: UtrinkiCategory | null;
  draft?: boolean;
  progressIndex: number;
  progressCount: number;
  saved: boolean;
  onOpenSources: () => void;
  onOpenSaved: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenStory: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(story.imageUrl) && !imageFailed;
  return (
    <article
      className="relative flex h-dvh snap-start snap-always flex-col overflow-hidden bg-[#1f1f1f] text-[#f3f8fe]"
      aria-labelledby={`utrinki-title-${story.id}`}
    >
      {showImage ? (
        <img
          src={story.imageUrl ?? undefined}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3a4454,transparent_46%),linear-gradient(160deg,#243044,#111318_70%)]">
          <img
            src={logoNoText}
            alt=""
            className="absolute top-[38%] left-1/2 h-16 w-16 -translate-x-1/2 opacity-40"
          />
          <p className="sr-only">Brez fotografije</p>
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.96)_100%)]" />
      <div className="absolute inset-x-0 top-0 z-20">
        <ReelChrome category={category} />
        <div className="pt-1">
          <CategoryRail
            category={category}
            pending={pendingCategory}
            draft={draft}
          />
        </div>
      </div>
      <div className="relative z-10 mt-auto flex flex-col gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <ReelProgress index={progressIndex} count={progressCount} />
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold tracking-[0.5px] text-[#0084e5] uppercase">
              {story.categoryLabel} · {updatedKicker(story.updatedAt)}
            </p>
            <h2
              id={`utrinki-title-${story.id}`}
              className="mt-1 line-clamp-4 text-[27px] leading-[30px] font-bold text-balance"
            >
              {story.title}
            </h2>
            {story.summary && (
              <p className="mt-2 line-clamp-3 text-[15px] leading-5 text-[#f3f8fe]/85">
                {story.summary}
              </p>
            )}
          </div>
          <div className="flex w-[72px] shrink-0 flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <ActionButton
                label={`Viri, ${story.providerCount}`}
                onClick={onOpenSources}
              >
                <img src={sourcesIcon} alt="" width={24} height={24} />
              </ActionButton>
              <span className="text-center text-[11px] leading-[14px] font-semibold">
                Viri · {story.providerCount}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ActionButton
                label={saved ? "Odstrani iz shranjenih" : "Shrani"}
                pressed={saved}
                onClick={onToggleSave}
              >
                <Bookmark
                  size={22}
                  color="#F3F8FE"
                  fill={saved ? "#F3F8FE" : "none"}
                  aria-hidden
                />
              </ActionButton>
              <button
                type="button"
                onClick={onOpenSaved}
                className="text-center text-[11px] leading-[14px] font-semibold focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                {saved ? "Shranjeno" : "Shrani"}
              </button>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ActionButton label="Deli" onClick={onShare}>
                <img src={shareIcon} alt="" width={24} height={24} />
              </ActionButton>
              <span className="text-[11px] leading-[14px] font-semibold">
                Deli
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSources}
          className="rounded-[14px] border border-white/12 bg-black/55 px-3 py-2.5 text-left focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span className="flex items-center gap-3">
            <ProviderStack
              providers={story.providers}
              total={story.providerCount}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
              {story.coverageLabel}
            </span>
            <span className="shrink-0 text-[14px] font-semibold whitespace-nowrap text-[#0084e5]">
              Primerjaj ›
            </span>
          </span>
          <BiasBar bias={story.bias} className="mt-3" />
        </button>
        <Link
          to={story.storyPath}
          onClick={onOpenStory}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0084e5] text-[15px] font-semibold text-[#f3f8fe] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Preberi celoten sklop
          <img src={arrowIcon} alt="" width={18} height={18} />
        </Link>
      </div>
    </article>
  );
}

export function BiasBar({
  bias,
  className = "",
}: {
  bias: UtrinkiStory["bias"];
  className?: string;
}) {
  const rated = bias.left + bias.center + bias.right;
  if (rated === 0) {
    return (
      <p className={`text-[11px] font-semibold text-[#f3f8fe]/70 ${className}`}>
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
      text: "text-[#ff706f]",
    },
    {
      key: "center",
      label: "CENTER",
      percent: bias.centerPercent,
      color: "bg-white",
      text: "text-[#f3f8fe]",
    },
    {
      key: "right",
      label: "DESNO",
      percent: bias.rightPercent,
      color: "bg-[#0084e5]",
      text: "text-[#0084e5]",
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
            {part.label} {part.percent}%
          </span>
        ))}
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded">
        {parts.map((part) =>
          part.percent > 0 ? (
            <span
              key={part.key}
              className={`${part.color} h-2`}
              style={{ width: `${part.percent}%` }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
