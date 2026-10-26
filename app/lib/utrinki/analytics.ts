export type DwellBucket = "0-3s" | "3-10s" | "10-30s" | "30s+";

export function dwellBucket(elapsedMs: number): DwellBucket {
  if (elapsedMs < 3000) return "0-3s";
  if (elapsedMs < 10_000) return "3-10s";
  if (elapsedMs < 30_000) return "10-30s";
  return "30s+";
}

type ReelProps = Record<string, string | number | boolean>;

export function captureReel(name: string, props: ReelProps) {
  if (typeof window === "undefined") return;
  window.posthog?.capture(name, props);
}
