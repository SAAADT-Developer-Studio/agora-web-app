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
import type { InflationSeries } from "~/lib/services/external";
import { Await } from "react-router";

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

type GDPSeries = {
  year: string;
  value: number;
};

export function EconomyCard({
  gdpSeries,
  inflationSeries,
}: {
  gdpSeries: Promise<GDPSeries[]>;
  inflationSeries: Promise<InflationSeries[]>;
}) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 col-span-1 row-span-2 flex flex-col rounded-md border-1 dark:border-0">
      <div className="flex w-full items-center justify-start gap-3 p-5">
        <Wallet className="h-6 w-6" />
        <p className="font-bold uppercase">Ekonomija</p>
      </div>

      <div className="grid grid-cols-1 grid-rows-2 pt-0">
        <Card className="gap-0 border-none py-0 shadow-none">
          <CardHeader className="!p-0">
            <div className="px-6 pt-2">
              <CardTitle>Bruto domači proizvod (BDP)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <React.Suspense fallback={<div>Loading...</div>}>
              <Await resolve={gdpSeries}>
                {(gdpData) => (
                  <GDPChart
                    gdpData={gdpData.map((d) => ({
                      year: d.year,
                      gdp: d.value,
                    }))}
                  />
                )}
              </Await>
            </React.Suspense>
          </CardContent>
        </Card>
        <Card className="gap-0 border-none py-0 shadow-none">
          <CardHeader className="!p-0">
            <div className="px-6 pt-2">
              <CardTitle>
                Inflacija (
                <a
                  className="hover:underline"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  href="https://www.stat.si/StatWeb/en/Field/Index/2"
                >
                  HICP
                </a>
                )
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <React.Suspense fallback={<div>Loading...</div>}>
              <Await resolve={inflationSeries}>
                {(inflationData) => (
                  <InflationChart
                    inflationData={inflationData.map((d) => ({
                      date: d.month,
                      hicp: d.value,
                    }))}
                  />
                )}
              </Await>
            </React.Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GDPChart({ gdpData }: { gdpData: { year: string; gdp: number }[] }) {
  return (
    <ChartContainer config={gdpConfig} className="w-full">
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
        <Bar dataKey="gdp" fill="var(--color-electricblue)" radius={0} />
      </BarChart>
    </ChartContainer>
  );
}

function InflationChart({
  inflationData,
}: {
  inflationData: { date: string; hicp: number }[];
}) {
  return (
    <ChartContainer config={inflationConfig} className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={inflationData}>
          <defs>
            <linearGradient id="hicpFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="black" stopOpacity={0.35} />
              <stop offset="100%" stopColor="black" stopOpacity={0.05} />
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
  );
}
