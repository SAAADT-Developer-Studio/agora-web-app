import { Link } from "react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import closeIcon from "~/assets/utrinki/close.svg";
import { Dialog, DialogOverlay, DialogPortal } from "~/components/ui/dialog";
import type { SavedMap } from "~/lib/utrinki/store";

export function SavedSheet({
  open,
  saved,
  onClose,
  onUnsave,
  onOpen,
}: {
  open: boolean;
  saved: SavedMap;
  onClose: () => void;
  onUnsave: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const items = Object.entries(saved)
    .slice()
    .sort((a, b) => b[1].savedAt - a[1].savedAt);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(5,6,7,0.58)] backdrop-blur-none" />
        <DialogPrimitive.Content className="fixed right-0 bottom-0 left-0 z-50 mx-auto flex h-[min(70dvh,560px)] w-full max-w-[390px] flex-col rounded-t-[20px] bg-[#414141] text-[#f3f8fe] shadow-[0px_-8px_32px_-4px_rgba(0,0,0,0.28)] outline-none">
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#f3f8fe]/30" />
          </div>
          <div className="flex items-center justify-between px-4 pt-3">
            <DialogPrimitive.Title className="text-[20px] font-bold">
              Shranjeni sklopi
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Zapri"
              className="grid size-8 place-items-center rounded-full bg-[#292929]"
            >
              <img src={closeIcon} alt="" width={16} height={16} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="px-4 pt-1 text-[13px] text-[#f3f8fe]/70">
            Shranjeno je samo na tej napravi.
          </DialogPrimitive.Description>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-[#f3f8fe]/80">
              Ni shranjenih sklopov. Tapni Shrani na sklopu, ki ga želiš
              obdržati.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              {items.map(([id, entry]) => (
                <li key={id} className="flex gap-3 rounded-xl bg-[#292929] p-3">
                  {entry.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="size-14 shrink-0 rounded-lg bg-[#1f1f1f]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold tracking-wide text-[#0084e5] uppercase">
                      {entry.categoryLabel}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[15px] leading-5 font-semibold">
                      {entry.title}
                    </span>
                    <span className="mt-2 flex gap-3 text-[13px] font-semibold">
                      <Link
                        to={`/zgodba/${id}`}
                        onClick={() => onOpen(Number(id))}
                        className="text-[#0084e5]"
                      >
                        Odpri
                      </Link>
                      <button
                        type="button"
                        onClick={() => onUnsave(Number(id))}
                        className="text-[#f3f8fe]/70"
                      >
                        Odstrani
                      </button>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
