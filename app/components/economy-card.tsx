import { Wallet } from "lucide-react";

export type EconomyCardProps = {
  gdpSeries?: GDPSeries[];
};

export type GDPSeries = {
  year: string;
  value: number;
};

export default function EconomyCard({ gdpSeries }: EconomyCardProps) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 col-span-1 row-span-2 flex flex-col rounded-md border-1 dark:border-0">
      <div className="flex w-full items-center justify-start gap-3 p-5">
        <Wallet className="h-6 w-6" />
        <p className="font-bold uppercase">Ekonomija</p>
      </div>
      {/* todo */}
    </div>
  );
}
