import type { BiasRating } from "~/enums/biasRatingKey";

export function biasKeyToColor(biasKey: string, withOpacity = false): string {
  const biasMap = {
    left: `${withOpacity ? "bg-[#FA2D36]/70" : "bg-[#FA2D36]"} ${withOpacity ? "border-1 md:border-2 border-[#FA2D36]" : ""} text-vidikwhite`,
    "center-left": `${withOpacity ? "bg-[#FF6166]/70" : "bg-[#FF6166]"} ${withOpacity ? "border-1 md:border-2 border-[#FF6166]" : ""} text-vidikwhite`,
    center: `${withOpacity ? "bg-[#FEFFFF]/90" : "bg-[#FEFFFF]"} ${withOpacity ? "border-1 md:border-2 border-[#FEFFFF]" : ""} text-black`,
    "center-right": `${withOpacity ? "bg-[#52A1FF]/70" : "bg-[#52A1FF]"} ${withOpacity ? "border md:border-2 border-[#52A1FF]" : ""} text-vidikwhite`,
    right: `${withOpacity ? "bg-[#2D7EFF]/70" : "bg-[#2D7EFF]"} ${withOpacity ? "border-1 md:border-2 border-[#2D7EFF]" : ""} text-vidikwhite`,
  } satisfies Record<BiasRating, string>;

  return (
    biasMap[biasKey as BiasRating] ||
    `${withOpacity ? "bg-foreground/70" : "bg-foreground"} ${withOpacity ? "border-1 md:border-2 border-foreground" : ""} text-primary`
  );
}
