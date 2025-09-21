import { config } from "~/config";

export type SourcesProps = {
  sources?: string[];
  numberOfArticles: number;
};

export function Sources({ sources, numberOfArticles }: Readonly<SourcesProps>) {
  const sourcesKeys = sources || ["delo", "rtv", "siol"];
  return (
    <div className="isolate flex flex-col items-start justify-start">
      <p className="p-sm">{numberOfArticles} člankov</p>
      <div className="flex h-8 items-start justify-start py-2">
        {sourcesKeys.map((key, index) => {
          const overlap = index * -12;
          return (
            <img
              key={"source" + index}
              src={`${config.imagesUrl}/providers/${key}.webp`}
              alt={`Source ${index}`}
              className="h-6 w-6 rounded-full"
              style={{
                transform: `translateX(${overlap}px)`,
                zIndex: 10 - index,
              }}
            />
          );
        })}

        {numberOfArticles > 3 && (
          <p className="p-sm h-full -translate-x-[24px] translate-y-1.5">...</p>
        )}
      </div>
    </div>
  );
}
