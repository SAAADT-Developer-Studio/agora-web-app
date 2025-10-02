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
          className="p-sm hidden h-full items-center justify-start md:flex"
          style={{ width: `${leftPercent}%` }}
        >
          LEVA: {leftPercent}%
        </div>
        <div
          className="p-sm hidden h-full items-center justify-start md:flex"
          style={{ width: `${centerPercent}%` }}
        >
          CENTER: {centerPercent}%
        </div>
        <div
          className="p-sm hidden h-full items-center justify-start md:flex"
          style={{ width: `${rightPercent}%` }}
        >
          DESNA: {rightPercent}%
        </div>
      </div>
      <div className="border-vidikdarkgray flex h-2 w-full items-center justify-between rounded-lg border-[0.5px] dark:border-0">
        <div
          className="bg-leftred h-full rounded-l-lg"
          style={{ width: `${leftPercent}%` }}
        />
        <div
          className="bg-centerwhite h-full"
          style={{ width: `${centerPercent}%` }}
        />
        <div
          className="bg-electricblue h-full rounded-r-lg"
          style={{ width: `${rightPercent}%` }}
        />
      </div>
    </div>
  );
}
