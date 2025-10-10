import { config } from "~/config";
import { resolvePlural } from "~/lib/utils";

export type SourcesProps = {
  numberOfArticles: number;
  providerKeys: string[];
};

export function Sources({
  numberOfArticles,
  providerKeys,
}: Readonly<SourcesProps>) {
  const MAX_DISPLAYED_SOURCES = 4;
  return (
    <div className="isolate flex flex-col items-start justify-start">
      <p className="p-sm">
        {numberOfArticles}{" "}
        {resolvePlural({
          count: numberOfArticles,
          singular: "članek",
          dual: "članka",
          plural: "člankov",
        })}
      </p>
      <div className="flex h-8 items-start justify-start py-2">
        {providerKeys.slice(0, MAX_DISPLAYED_SOURCES).map((key, index) => {
          const overlap = index * -12;
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
              transform: `translateX(${MAX_DISPLAYED_SOURCES * -12 + 3}px)`,
              zIndex: 10 - MAX_DISPLAYED_SOURCES,
            }}
          >
            +
          </div>
        )}
      </div>
    </div>
  );
}
