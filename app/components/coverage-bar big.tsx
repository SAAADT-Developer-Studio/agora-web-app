export type CoverageBarProps = {
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
};

export default function CoverageBarBig({
  leftPercent,
  centerPercent,
  rightPercent,
}: Readonly<CoverageBarProps>) {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full items-center justify-between pb-1.5">
        <div
          className="p-sm-light flex h-full items-center justify-start"
          style={{ width: `${leftPercent}%` }}
        >
          LEFT: {leftPercent}%
        </div>
        <div
          className="p-sm-light flex h-full items-center justify-start"
          style={{ width: `${centerPercent}%` }}
        >
          CENTER: {centerPercent}%
        </div>
        <div
          className="p-sm-light flex h-full items-center justify-start"
          style={{ width: `${rightPercent}%` }}
        >
          RIGHT: {rightPercent}%
        </div>
      </div>
      <div className="flex h-2 w-full items-center justify-between rounded-lg bg-gray-200">
        <div
          className="bg-leftred h-full rounded-l-lg"
          style={{ width: `${leftPercent}%` }}
        />
        <div
          className="bg-centerwhite h-full"
          style={{ width: `${centerPercent}%` }}
        />
        <div
          className="bg-rightblue h-full rounded-r-lg"
          style={{ width: `${rightPercent}%` }}
        />
      </div>
    </div>
  );
}
