import { Link } from "react-router";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import closeIcon from "~/assets/utrinki/close.svg";
import arrowIcon from "~/assets/utrinki/arrow.svg";
import { Dialog, DialogOverlay, DialogPortal } from "~/components/ui/dialog";
import { BiasBar } from "~/components/utrinki/story-card";
import { ProviderMark } from "~/components/utrinki/provider-mark";
import { biasSideLabel } from "~/lib/utrinki/bias";
import type { BiasSide } from "~/utils/biasSide";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";
import { cn } from "~/lib/utils";
import type { UtrinkiStory } from "~/lib/utrinki/model";

type SideFilter = "all" | BiasSide | "unrated";

const dot: Record<BiasSide | "unrated", string> = {
  left: "bg-[#ff706f]",
  center: "bg-white",
  right: "bg-[#0084e5]",
  unrated: "bg-[#9aa3af]",
};

const accent: Record<BiasSide | "unrated", string> = {
  left: "bg-[#ff706f]",
  center: "bg-white",
  right: "bg-[#0084e5]",
  unrated: "bg-[#9aa3af]",
};

export function SourcesSheet({
  story,
  onClose,
  onOpenStory,
  onHide,
}: {
  story: UtrinkiStory | null;
  onClose: () => void;
  onOpenStory: () => void;
  onHide: () => void;
}) {
  const [filter, setFilter] = useState<SideFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const open = story !== null;

  const articles = story?.articles ?? [];
  const bias = story?.bias;
  const tabs: {
    key: SideFilter;
    label: string;
    count: number;
    dot?: BiasSide | "unrated";
  }[] = bias
    ? [
        { key: "all", label: "Vsi", count: bias.total },
        { key: "left", label: "Levo", count: bias.left, dot: "left" },
        { key: "center", label: "Center", count: bias.center, dot: "center" },
        { key: "right", label: "Desno", count: bias.right, dot: "right" },
        ...(bias.unrated > 0
          ? [
              {
                key: "unrated" as const,
                label: "Neopredeljeni",
                count: bias.unrated,
                dot: "unrated" as const,
              },
            ]
          : []),
      ]
    : [];

  const visible = articles.filter((article) => {
    if (filter === "all") return true;
    if (filter === "unrated") return article.side === null;
    return article.side === filter;
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setExpanded(false);
          setFilter("all");
          onClose();
        }
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(5,6,7,0.58)] backdrop-blur-none" />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 bottom-0 left-0 z-50 mx-auto flex w-full max-w-[390px] flex-col overflow-hidden rounded-t-[20px] bg-[#414141] text-[#f3f8fe] shadow-[0px_-8px_32px_-4px_rgba(0,0,0,0.28)] outline-none",
            expanded ? "h-dvh rounded-none" : "h-[min(76dvh,640px)]",
          )}
          aria-describedby="utrinki-sheet-summary"
          onPointerDown={(event) => {
            if (!(event.target instanceof HTMLElement)) return;
            const handle = event.target.closest("[data-sheet-handle]");
            if (!handle) return;
            const startY = event.clientY;
            const move = (pointer: PointerEvent) => {
              const dy = pointer.clientY - startY;
              if (dy < -56) setExpanded(true);
              if (dy > 80) onClose();
              else if (expanded && dy > 56) setExpanded(false);
            };
            const up = (pointer: PointerEvent) => {
              move(pointer);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointerup", up);
          }}
        >
          <div
            data-sheet-handle
            className="flex cursor-grab justify-center pt-2.5 pb-1"
          >
            <span className="h-1 w-10 rounded-full bg-[#f3f8fe]/30" />
          </div>
          {story && bias && (
            <>
              <div className="flex items-center justify-between px-4">
                <DialogPrimitive.Title className="text-[20px] font-bold">
                  Kako poročajo
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Zapri"
                  className="grid size-8 place-items-center rounded-full bg-[#292929] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <img src={closeIcon} alt="" width={16} height={16} />
                </DialogPrimitive.Close>
              </div>
              <p
                id="utrinki-sheet-summary"
                className="px-4 pt-1 text-[13px] text-[#f3f8fe]/70"
              >
                {story.coverageLabel} · {story.spanLabel}
              </p>
              <BiasBar bias={bias} className="px-4 pt-3" />
              <div
                role="tablist"
                aria-label="Filter po perspektivi"
                className="mx-4 mt-3 flex h-10 gap-0 overflow-x-auto rounded-full bg-[#292929] p-1 [scrollbar-width:none]"
              >
                {tabs.map((tab) => {
                  const selected = filter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(tab.key)}
                      className={cn(
                        "inline-flex h-8 min-w-[5.5rem] flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold whitespace-nowrap",
                        selected
                          ? "bg-[#f3f8fe] text-[#12141a]"
                          : "text-[#f3f8fe]",
                      )}
                    >
                      {tab.dot && (
                        <span
                          className={cn("size-2 rounded-full", dot[tab.dot])}
                        />
                      )}
                      {tab.label} {tab.count}
                    </button>
                  );
                })}
              </div>
              <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3">
                {visible.map((article) => {
                  const side = article.side ?? "unrated";
                  return (
                    <li key={article.id}>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative flex min-h-[76px] gap-3 overflow-hidden rounded-xl bg-[#292929] px-3 py-2.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                      >
                        <span
                          className={cn(
                            "absolute top-3 bottom-3 left-0 w-[3px] rounded-full",
                            accent[side],
                          )}
                        />
                        <span className="mt-1 grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[#494949] bg-white">
                          <ProviderMark
                            provider={{
                              key: article.providerKey,
                              name: article.providerName,
                            }}
                            className="size-6"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold text-[#f3f8fe]/65">
                            {article.providerName} ·{" "}
                            {biasSideLabel(article.side)} ·{" "}
                            {timeDiffInSlovenian(new Date(article.publishedAt))}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-[15px] leading-[19px] font-semibold">
                            {article.title}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="self-center text-[22px] text-[#f3f8fe]/50"
                        >
                          ›
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between px-4 pt-1">
                <Link
                  to="/metodologija"
                  className="text-[13px] font-semibold text-[#0084e5]"
                >
                  Kako razvrščamo medije? ›
                </Link>
                <button
                  type="button"
                  onClick={onHide}
                  className="text-[13px] text-[#f3f8fe]/70"
                >
                  Skrij sklop
                </button>
              </div>
              <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
                <Link
                  to={story.storyPath}
                  onClick={onOpenStory}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0084e5] text-[15px] font-semibold"
                >
                  Preberi celoten sklop
                  <img src={arrowIcon} alt="" width={18} height={18} />
                </Link>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
