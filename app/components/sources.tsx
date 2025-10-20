import { Newspaper } from "lucide-react";
import { config } from "~/config";
import { resolvePlural } from "~/utils/resolvePlural";

export type SourcesProps = {
  numberOfArticles: number;
  providerKeys: string[];
};

export function Sources({
  numberOfArticles,
  providerKeys,
}: Readonly<SourcesProps>) {
  const MAX_DISPLAYED_SOURCES = 4;

  const displayedProviders = providerKeys.slice(0, MAX_DISPLAYED_SOURCES);
  const itemsDisplayed =
    providerKeys.length > MAX_DISPLAYED_SOURCES
      ? MAX_DISPLAYED_SOURCES + 1
      : providerKeys.length;

  return (
    <div className="flex items-center justify-center gap-1">
      <div className="flex h-8 items-center justify-center">
        {displayedProviders.map((key, index) => {
          const overlap = (itemsDisplayed - 1 - index) * 12;
          return (
            <img
              key={key}
              src={`${config.imagesUrl}/providers/${key}.webp`}
              alt={`Vir ${index}`}
              className="h-6 w-6 rounded-full"
              style={{
                transform: `translateX(${overlap}px)`,
                zIndex: 10 - index,
              }}
            />
          );
        })}

        {providerKeys.length > MAX_DISPLAYED_SOURCES && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 font-light"
            style={{
              zIndex: 10 - MAX_DISPLAYED_SOURCES,
            }}
          >
            +
          </div>
        )}
      </div>
      <div className="text-md flex h-8 items-center gap-2 rounded bg-black/50 px-2 text-white">
        <Newspaper className="size-5" />
        {numberOfArticles}
      </div>
    </div>
  );
}
