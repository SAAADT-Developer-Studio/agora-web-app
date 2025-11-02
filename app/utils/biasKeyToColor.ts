import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToColor(biasKey: string, withOpacity = false): string {
  const biasMapOpaque = {
    left: "bg-[#FA2D36] text-vidikwhite",
    "center-left": "bg-[#FF6166] text-vidikwhite",
    center: "bg-[#FEFFFF] text-black border border-vidikblack/10",
    "center-right": "bg-[#52A1FF] text-vidikwhite",
    right: "bg-[#2D7EFF] text-vidikwhite",
  } satisfies Record<BiasRating, string>;

  const biasMapWithOpacity = {
    left: "bg-[#FA2D36]/70 border-1 md:border-2 border-[#FA2D36] text-vidikwhite",
    "center-left":
      "bg-[#FF6166]/70 border-1 md:border-2 border-[#FF6166] text-vidikwhite",
    center:
      "bg-[#FEFFFF]/90 border-1 md:border-2 dark:border-[#FEFFFF] border-vidikblack/10 text-black",
    "center-right":
      "bg-[#52A1FF]/70 border md:border-2 border-[#52A1FF] text-vidikwhite",
    right:
      "bg-[#2D7EFF]/70 border-1 md:border-2 border-[#2D7EFF] text-vidikwhite",
  } satisfies Record<BiasRating, string>;

  const biasMap = withOpacity ? biasMapWithOpacity : biasMapOpaque;

  const defaultClass = withOpacity
    ? "bg-foreground/70 border-1 md:border-2 border-foreground text-primary"
    : "bg-foreground text-primary border border-current/10";

  return biasMap[biasKey as BiasRating] ?? defaultClass;
}
