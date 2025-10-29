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

import { useLocalStorage } from "~/hooks/use-local-storage";

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
import { SideCardContainer, SideCardHeader } from "~/components/ui/side-card";
import { ErrorUI } from "~/components/ui/error-ui";
import { Spinner } from "~/components/ui/spinner";

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
    <SideCardContainer>
      <SideCardHeader>
        <Wallet className="size-5" />
        <p className="font-bold uppercase">Ekonomija</p>
      </SideCardHeader>
      <div className="grid h-full grid-cols-1 grid-rows-2 pt-0">
        <Card className="gap-0 border-none py-0 shadow-none">
          <CardHeader className="!p-0">
            <div className="ml-0 px-6 pt-2 md:mr-[10%] lg:ml-0">
              <CardTitle>Bruto domači proizvod (BDP)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 justify-center px-5">
            <React.Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center">
                  <Spinner className="size-8" />
                </div>
              }
            >
              <Await
                resolve={gdpSeries}
                errorElement={
                  <ErrorUI
                    message="Napaka pri nalaganju podatkov o BDP"
                    size="small"
                  />
                }
              >
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
            <div className="px-6 pt-2 md:mr-[10%] lg:ml-0">
              <CardTitle>
                Inflacija (
                <a
                  className="hover:underline"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  href="https://en.wikipedia.org/wiki/Harmonised_Index_of_Consumer_Prices"
                >
                  HICP
                </a>
                )
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center px-5">
            <React.Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center">
                  <Spinner className="size-8" />
                </div>
              }
            >
              <Await
                resolve={inflationSeries}
                errorElement={
                  <ErrorUI
                    message="Napaka pri nalaganju podatkov o HICP"
                    size="small"
                  />
                }
              >
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
    </SideCardContainer>
  );
}

function GDPChart({ gdpData }: { gdpData: { year: string; gdp: number }[] }) {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  return (
    <ChartContainer config={gdpConfig} className="w-full md:w-[80%] lg:w-full">
      <BarChart accessibilityLayer data={gdpData} barCategoryGap={1}>
        <CartesianGrid
          vertical={false}
          stroke={theme === "dark" ? "#5a5a5a" : "var(--color-vidiklightgray)"}
        />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          stroke={theme === "dark" ? "white" : "black"}
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
  const [theme, setTheme] = useLocalStorage("theme", "light");
  return (
    <ChartContainer
      config={inflationConfig}
      className="w-full md:w-[80%] lg:w-full"
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={inflationData}>
          <defs>
            <linearGradient id="hicpFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="black" stopOpacity={0.35} />
              <stop offset="100%" stopColor="black" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke={
              theme === "dark" ? "#5a5a5a" : "var(--color-vidiklightgray)"
            }
          />
          <XAxis
            stroke={theme === "dark" ? "white" : "black"}
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
