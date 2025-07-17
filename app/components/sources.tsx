import Delo from "~/assets/delo.png";
import Rtv from "~/assets/rtv.png";
import Siol from "~/assets/siol.png";

export type SourcesProps = {
  sourcesUrls?: string[];
  numberOfSources: number;
};

export function Sources({
  sourcesUrls,
  numberOfSources,
}: Readonly<SourcesProps>) {
  const sourcesUrlsList = sourcesUrls || [Delo, Rtv, Siol];
  return (
    <div className="flex flex-col items-start justify-start">
      <p className="p-sm">{numberOfSources} virov</p>
      <div className="flex h-8 items-start justify-start py-2">
        {sourcesUrlsList.map((url, index) => {
          const overlap = index * -12;
          return (
            <img
              key={"source" + index}
              src={url}
              alt={`Source ${index}`}
              className="h-6 w-6 rounded-full"
              style={{
                transform: `translateX(${overlap}px)`,
                zIndex: 10 - index,
              }}
            />
          );
        })}

        {numberOfSources > 3 && (
          <p className="p-sm h-full -translate-x-[24px] translate-y-1.5">...</p>
        )}
      </div>
    </div>
  );
}
