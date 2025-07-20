export type CoverageBarProps = {
  leftPercent: number;
  rightPercent: number;
  centerPercent: number;
};

export default function CoverageBar({
  leftPercent,
  centerPercent,
  rightPercent,
}: Readonly<CoverageBarProps>) {
  return (
    <div className="border-vidikdarkgray flex h-1 w-full items-center justify-between rounded-lg border-[0.5px] bg-gray-200 dark:border-0">
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
  );
}
