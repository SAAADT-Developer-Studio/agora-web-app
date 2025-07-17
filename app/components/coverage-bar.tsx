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
    <div className="flex h-1 w-full items-center justify-between rounded-lg bg-gray-200">
      <div
        className="bg-gradient-leftred h-full rounded-l-lg"
        style={{ width: `${leftPercent}%` }}
      />
      <div
        className="bg-centerwhite h-full"
        style={{ width: `${centerPercent}%` }}
      />
      <div
        className="bg-gradient-rightblue h-full rounded-r-lg"
        style={{ width: `${rightPercent}%` }}
      />
    </div>
  );
}
