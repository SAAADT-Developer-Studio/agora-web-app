import { cn } from "~/lib/utils";

export default function Tag({ text, big }: { text: string; big?: boolean }) {
  return (
    <div
      className={cn(
        `p-xs text-vidikwhite dark:bg-electricblue flex h-[21px] items-center justify-center rounded-md border border-white/30 bg-black px-2 py-1 text-nowrap uppercase shadow-sm dark:border-transparent`,
      )}
    >
      {text}
    </div>
  );
}
