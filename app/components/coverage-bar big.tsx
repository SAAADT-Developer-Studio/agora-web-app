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
        {leftPercent > 0 && (
          <div
            className="hidden h-full items-center justify-start gap-1 overflow-hidden text-[15px] font-semibold whitespace-nowrap md:flex"
            style={{ width: `${leftPercent}%` }}
          >
            <span className="overflow-hidden text-ellipsis">LEVA:</span>
            <span className="flex-shrink-0">{leftPercent}%</span>
          </div>
        )}
        {centerPercent > 0 && (
          <div
            className="hidden h-full items-center justify-start gap-1 overflow-hidden text-[15px] font-semibold whitespace-nowrap md:flex"
            style={{ width: `${centerPercent}%` }}
          >
            <span className="overflow-hidden text-ellipsis">CENTER:</span>
            <span className="flex-shrink-0">{centerPercent}%</span>
          </div>
        )}
        {rightPercent > 0 && (
          <div
            className="hidden h-full items-center justify-start gap-1 overflow-hidden text-[15px] font-semibold whitespace-nowrap md:flex"
            style={{ width: `${rightPercent}%` }}
          >
            <span className="overflow-hidden text-ellipsis">DESNA:</span>
            <span className="flex-shrink-0">{rightPercent}%</span>
          </div>
        )}
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
