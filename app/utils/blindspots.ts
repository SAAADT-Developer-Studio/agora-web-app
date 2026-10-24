import type { ArticleType } from "~/lib/services/ranking";

export type BlindspotSide = "left" | "right";

export type Blindspots = {
  /** Covered mostly by left-leaning outlets; the right barely reports it. */
  left: ArticleType[];
  /** Covered mostly by right-leaning outlets; the left barely reports it. */
  right: ArticleType[];
};

export const EMPTY_BLINDSPOTS: Blindspots = { left: [], right: [] };

/** Stories shown per side. */
export const BLINDSPOTS_PER_SIDE = 3;
/** Rated articles a story needs before its skew means anything. */
export const BLINDSPOT_MIN_RATED = 4;
/** Share of rated coverage one side must hold (rounded, like the bias bar). */
export const BLINDSPOT_MIN_PERCENT = 75;
