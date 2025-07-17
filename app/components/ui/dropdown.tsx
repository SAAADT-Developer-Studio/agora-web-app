import { Book, GalleryHorizontalEnd, Coffee, Mail } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Dropdown({ open, onClose }: Readonly<Props>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="bg-primary80 text-primary absolute top-[58px] right-4 z-50 w-56 rounded-lg shadow-lg"
    >
      <div className="flex flex-col p-2">
        <a
          href="#"
          className="p-sm flex items-center gap-3 rounded-md px-4 py-2"
        >
          <Book size={18} />
          UVOD V POLITIKO
        </a>
        <a
          href="#"
          className="p-sm flex items-center gap-3 rounded-md px-4 py-2 hover:bg-white/10"
        >
          <GalleryHorizontalEnd size={18} />
          SWIPER
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-white/10"
        >
          <Coffee size={18} />
          DONIRAJ
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-white/10"
        >
          <Mail size={18} />
          KONTAKT
        </a>
      </div>
    </div>
  );
}
