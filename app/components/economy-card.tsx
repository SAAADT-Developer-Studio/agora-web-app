"use client";

import { Wallet } from "lucide-react";
import * as React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";

export type EconomyCardProps = {
  gdpSeries?: GDPSeries[];
  inflationSeries?: InflationSeries[];
};

export type GDPSeries = {
  year: string;
  value: number;
};

export type InflationSeries = {
  month: string;
  value: number;
};

const gdpConfig = {
  gdp: {
    label: "BDP (mio €)",
    color: "oklch(0.646 0.222 41.116)",
  },
} satisfies ChartConfig;

const inflationConfig = {
  hicp: {
    label: "Inflacija (YoY %)",
    color: "oklch(0.646 0.222 41.116)",
  },
} satisfies ChartConfig;

export default function EconomyCard({
  gdpSeries = [],
  inflationSeries = [],
}: Readonly<EconomyCardProps>) {
  const gdpData = React.useMemo(
    () => gdpSeries.map((d) => ({ year: d.year, gdp: d.value })),
    [gdpSeries],
  );

  const inflationData = React.useMemo(
    () => inflationSeries.map((d) => ({ date: d.month, hicp: d.value })),
    [inflationSeries],
  );

  return (
    <div className="bg-foreground border-vidikdarkgray/10 col-span-1 row-span-2 flex flex-col rounded-md border-1 dark:border-0">
      <div className="flex w-full items-center justify-start gap-3 p-5">
        <Wallet className="h-6 w-6" />
        <p className="font-bold uppercase">Ekonomija</p>
      </div>

      <div className="grid grid-cols-1 grid-rows-2 pt-0">
        <Card className="gap-0 border-none py-0 shadow-none">
          <CardHeader className="!p-0">
            <div className="ml-0 px-6 pt-2 md:ml-[10%] lg:ml-0">
              <CardTitle>Bruto domači proizvod (BDP)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center px-5">
            <ChartContainer
              config={gdpConfig}
              className="w-full md:w-[80%] lg:w-full"
            >
              <BarChart accessibilityLayer data={gdpData} barCategoryGap={1}>
                <CartesianGrid vertical={false} stroke="#5a5a5a" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  stroke="white"
                />
                <ChartTooltip
                  cursor={{ fill: "#5a5a5a" }}
                  content={
                    <ChartTooltipContent
                      className="border-none"
                      nameKey="gdp"
                      labelFormatter={(label, payload) => {
                        const value = payload && payload[0]?.value;
                        return `${label} — ${Intl.NumberFormat("sl-SI").format(Number(value))} mio €`;
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="gdp"
                  fill="var(--color-electricblue)"
                  radius={0}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="gap-0 border-none py-0 shadow-none">
          <CardHeader className="!p-0">
            <div className="ml-0 px-6 pt-2 md:ml-[10%] lg:ml-0">
              <CardTitle>
                Inflacija (
                <a
                  target="_blank"
                  href="https://www.stat.si/StatWeb/en/Field/Index/2"
                >
                  HICP
                </a>
                )
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center px-5">
            <ChartContainer
              config={inflationConfig}
              className="w-full md:w-[80%] lg:w-full"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={inflationData}>
                  <defs>
                    <linearGradient id="hicpFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="black" stopOpacity={0.35} />
                      <stop
                        offset="100%"
                        stopColor="black"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke="#5a5a5a" />
                  <XAxis
                    stroke="white"
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(value: string) => {
                      const [y, m] = value.split("-");
                      return `${m}/${y}`;
                    }}
                  />

                  <ChartTooltip
                    cursor={{ fill: "black" }}
                    content={
                      <ChartTooltipContent
                        nameKey="hicp"
                        labelFormatter={(v: string, payload: any) => {
                          const [y, m] = v.split("-");
                          const value = payload && payload[0]?.value;
                          return `${m}/${y} — ${Number(value).toFixed(1)} %`;
                        }}
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="hicp"
                    stroke="var(--color-electricblue)"
                    fill="var(--color-electricblue)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
