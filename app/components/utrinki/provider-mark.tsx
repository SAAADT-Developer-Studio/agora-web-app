import { useState } from "react";
import { ProviderImage } from "~/components/provider-image";
import { cn } from "~/lib/utils";

/** Outlet logo that fills its round frame edge to edge (no white padding). */
export function ProviderMark({
  provider,
  className,
}: {
  provider: { key: string; name: string };
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2a2d33]",
        className,
      )}
    >
      {failed ? (
        <span className="text-[10px] font-bold tracking-tight text-[#f3f8fe] uppercase">
          {provider.name.slice(0, 2)}
        </span>
      ) : (
        <ProviderImage
          provider={provider}
          size={60}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function ProviderStack({
  providers,
  total,
  max = 4,
}: {
  providers: { key: string; name: string }[];
  total: number;
  max?: number;
}) {
  const shown = providers.slice(0, max);
  const extra = Math.max(total - shown.length, 0);
  return (
    <span className="flex items-center">
      {shown.map((provider, index) => (
        <ProviderMark
          key={provider.key}
          provider={provider}
          className={cn("ring-surface ring-2", index > 0 && "-ml-2")}
        />
      ))}
      {extra > 0 && (
        <span className="ring-surface bg-surface-light text-surface-text -ml-2 grid size-8 place-items-center rounded-full text-[11px] font-semibold ring-2">
          +{extra}
        </span>
      )}
    </span>
  );
}
