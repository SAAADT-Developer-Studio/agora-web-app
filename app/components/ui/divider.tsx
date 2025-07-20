import { cn } from "~/lib/utils";

export default function Divider({
  text,
  reverse,
}: Readonly<{ text?: string; reverse?: boolean }>) {
  return (
    <div className="bg-primary relative col-span-full my-4 h-px">
      {text && (
        <span
          className={cn(
            "text-primary bg-background absolute",
            reverse ? "right-1/3" : "left-1/3",
            reverse ? "translate-x-[50%]" : "-translate-x-[50%]",
            "-translate-y-[50%] p-2 text-lg uppercase",
            "cursor-pointer",
            "border-draw",
            "rounded-lg",
            "hover:border-primary transition-transform duration-300 hover:scale-[1.05] hover:border-1",
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}
