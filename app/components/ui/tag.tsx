import { cn } from "~/lib/utils";

export default function Tag({ text }: { text: string; big?: boolean }) {
  return (
    <div
      className={cn(
        `text-vidikwhite flex h-[21px] items-center justify-center rounded-md border border-white/30 bg-black px-2 py-1 text-[10px] font-semibold text-nowrap uppercase shadow-sm`,
        "dark:bg-electricblue dark:border-transparent",
      )}
    >
      {text}
    </div>
  );
}
