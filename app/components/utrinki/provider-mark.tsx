import { useState } from "react";
import { ProviderImage } from "~/components/provider-image";

export function ProviderMark({
  provider,
  className = "size-7",
}: {
  provider: { key: string; name: string };
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-[10px] font-bold tracking-tight text-[#232323] uppercase">
        {provider.name.slice(0, 2)}
      </span>
    );
  }
  return (
    <ProviderImage
      provider={provider}
      size={60}
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

export function ProviderStack({
  providers,
  total,
}: {
  providers: { key: string; name: string }[];
  total: number;
}) {
  const shown = providers.slice(0, 4);
  const extra = Math.max(total - shown.length, 0);
  return (
    <div className="flex items-center">
      {shown.map((provider) => (
        <span
          key={provider.key}
          className="-mr-2 grid size-[34px] place-items-center overflow-hidden rounded-full border-2 border-[#1f1f1f] bg-white"
        >
          <ProviderMark provider={provider} />
        </span>
      ))}
      {extra > 0 && (
        <span className="grid size-[34px] place-items-center rounded-full border-2 border-[#1f1f1f] bg-[#0084e5] text-[11px] font-semibold text-[#f3f8fe]">
          +{extra}
        </span>
      )}
    </div>
  );
}
