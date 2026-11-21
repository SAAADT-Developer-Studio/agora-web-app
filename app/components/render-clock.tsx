import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";

const RenderClockContext = createContext<number | null>(null);

/**
 * `renderedAt` is the instant the HTML was produced. Hydration must format
 * clocks from that same instant; a cached page can be minutes older than
 * the browser, and `new Date()` during render would not match the HTML.
 */
export function RenderClockProvider({
  renderedAt,
  children,
}: {
  renderedAt: string | number;
  children: ReactNode;
}) {
  const value =
    typeof renderedAt === "number" ? renderedAt : Date.parse(renderedAt);
  return (
    <RenderClockContext.Provider value={value}>
      {children}
    </RenderClockContext.Provider>
  );
}

/** Server render time until mount, then the browser clock. */
export function useClientNow(): number {
  const renderedAt = useContext(RenderClockContext);
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    setNow(Date.now());
  }, [renderedAt]);
  if (now === null) return Date.now();
  return now;
}

export function RelativeTime({ date }: { date: Date | string | number }) {
  const now = useClientNow();
  const past = date instanceof Date ? date : new Date(date);
  return timeDiffInSlovenian(past, new Date(now));
}
