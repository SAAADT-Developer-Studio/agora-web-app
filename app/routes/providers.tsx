import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/providers";
import { getSeoMetas } from "~/lib/seo";
import {
  getProviderImageUrl,
  ProviderImage,
} from "~/components/provider-image";
import { ArrowLeftRight, Globe, Newspaper } from "lucide-react";
import { Link, data, href } from "react-router";
import { gte, desc, count } from "drizzle-orm";
import { article } from "~/drizzle/schema";
import { Card } from "~/components/ui/card";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { removeUrlProtocol } from "~/utils/removeUrlProtocol";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { BiasRatingKey } from "~/enums/biasRatingKey";
import { cn } from "~/lib/utils";

export interface PeriodStats {
  count: number;
  rank: number | null;
  totalProviders: number;
}

export interface ProviderStats {
  providerKey: string;
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
}

async function fetchAllProviderStats(db: any): Promise<ProviderStats[]> {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const currentDay = now.getDay();
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;

  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysToSubtract,
    0,
    0,
    0,
    0,
  );

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  function buildDenseRankMap(
    rows: Array<{ providerKey: string; count: number }>,
  ) {
    const rankMap = new Map<string, number>();
    let currentRank = 0;
    let lastCount: number | null = null;

    for (const r of rows) {
      if (lastCount === null || r.count < lastCount) {
        currentRank += 1;
        lastCount = r.count;
      }
      rankMap.set(r.providerKey, currentRank);
    }
    return rankMap;
  }

  const [todayAgg, weekAgg, monthAgg] = await Promise.all([
    db
      .select({ providerKey: article.newsProviderKey, count: count() })
      .from(article)
      .where(gte(article.publishedAt, startOfToday.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
    db
      .select({ providerKey: article.newsProviderKey, count: count() })
      .from(article)
      .where(gte(article.publishedAt, startOfWeek.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
    db
      .select({ providerKey: article.newsProviderKey, count: count() })
      .from(article)
      .where(gte(article.publishedAt, startOfMonth.toISOString()))
      .groupBy(article.newsProviderKey)
      .orderBy(desc(count())),
  ]);

  const todayCountMap = new Map(
    todayAgg.map((r: { providerKey: any; count: any }) => [
      r.providerKey,
      Number(r.count),
    ]),
  );
  const weekCountMap = new Map(
    weekAgg.map((r: { providerKey: any; count: any }) => [
      r.providerKey,
      Number(r.count),
    ]),
  );
  const monthCountMap = new Map(
    monthAgg.map((r: { providerKey: any; count: any }) => [
      r.providerKey,
      Number(r.count),
    ]),
  );

  const todayRankMap = buildDenseRankMap(todayAgg);
  const weekRankMap = buildDenseRankMap(weekAgg);
  const monthRankMap = buildDenseRankMap(monthAgg);

  const totalTodayProviders = todayAgg.length;
  const totalWeekProviders = weekAgg.length;
  const totalMonthProviders = monthAgg.length;

  const allProviderKeys = Array.from(
    new Set<string>([
      ...todayAgg.map((r: { providerKey: any }) => r.providerKey),
      ...weekAgg.map((r: { providerKey: any }) => r.providerKey),
      ...monthAgg.map((r: { providerKey: any }) => r.providerKey),
    ]),
  );

  const results: ProviderStats[] = allProviderKeys.map((providerKey) => ({
    providerKey,
    today: {
      count: (todayCountMap.get(providerKey) ?? 0) as number,
      rank: todayRankMap.get(providerKey) ?? null,
      totalProviders: totalTodayProviders,
    },
    week: {
      count: (weekCountMap.get(providerKey) ?? 0) as number,
      rank: weekRankMap.get(providerKey) ?? null,
      totalProviders: totalWeekProviders,
    },
    month: {
      count: (monthCountMap.get(providerKey) ?? 0) as number,
      rank: monthRankMap.get(providerKey) ?? null,
      totalProviders: totalMonthProviders,
    },
  }));

  return results;
}

function buildProviderMap<T extends { providerKey: string }>(
  providers: readonly T[],
): Map<string, Omit<T, "providerKey">> {
  const map = new Map<string, Omit<T, "providerKey">>();
  for (const { providerKey, ...rest } of providers) {
    map.set(providerKey, rest as Omit<T, "providerKey">);
  }
  return map;
}

export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "max-age=0, must-revalidate",
  };
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context;

  const providersPromise = context.measurer.time(
    "fetchAllProviders",
    async () =>
      await db.query.newsProvider.findMany({
        orderBy: (provider, { asc }) => [asc(provider.rank)],
      }),
  );

  const providerStatsPromise = context.measurer.time(
    "fetchAllProviderStats",
    async () => await fetchAllProviderStats(db),
  );

  const [providers, providerStats] = await Promise.all([
    providersPromise,
    providerStatsPromise,
  ]);

  const providerStatsMap = buildProviderMap(providerStats);

  return data(
    { providers, providerStatsMap },
    { headers: { "Cache-Control": "max-age=60, s-maxage=60" } },
  );
}

export default function ProvidersPage({ loaderData }: Route.ComponentProps) {
  const { providers, providerStatsMap } = loaderData;

  const [selectedBiasRatings, setSelectedBiasRatings] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("rank");

  const toggleBiasRating = (rating: string) => {
    setSelectedBiasRatings((prev) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [...prev, rating],
    );
  };

  const filteredAndSortedProviders = useMemo(() => {
    let result = [...providers];

    if (selectedBiasRatings.length > 0) {
      result = result.filter((p) =>
        selectedBiasRatings.includes(p.biasRating ?? ""),
      );
    }

    result.sort((a, b) => {
      const statsA = providerStatsMap.get(a.key);
      const statsB = providerStatsMap.get(b.key);

      switch (sortBy) {
        case "rank":
          return a.rank - b.rank;
        case "today-most":
          return (statsB?.today.count ?? 0) - (statsA?.today.count ?? 0);
        case "today-least":
          return (statsA?.today.count ?? 0) - (statsB?.today.count ?? 0);
        case "week-most":
          return (statsB?.week.count ?? 0) - (statsA?.week.count ?? 0);
        case "week-least":
          return (statsA?.week.count ?? 0) - (statsB?.week.count ?? 0);
        case "month-most":
          return (statsB?.month.count ?? 0) - (statsA?.month.count ?? 0);
        case "month-least":
          return (statsA?.month.count ?? 0) - (statsB?.month.count ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [providers, providerStatsMap, selectedBiasRatings, sortBy]);

  return (
    <section>
      <div className="mt-0 flex flex-wrap items-center justify-between p-0 md:mt-8 md:p-4">
        <h1 className="text-surface-text text-2xl font-bold md:text-5xl">
          Mediji
        </h1>

        <div className="mt-4 flex flex-wrap items-start justify-start gap-3 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="bg-surface shadow-vidik text-primary font-semibold !outline-none"
            >
              <Button variant="outline">
                Pristranskost
                {selectedBiasRatings.length > 0 && (
                  <span className="bg-surface text-primary ml-2 rounded-full px-2 py-0.5 text-xs">
                    {selectedBiasRatings.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface text-primary shadow-vidik w-56">
              <DropdownMenuLabel>Filtriraj po pristranskosti</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(BiasRatingKey).map((biasRatingKey) => (
                <DropdownMenuCheckboxItem
                  key={biasRatingKey}
                  checked={selectedBiasRatings.includes(biasRatingKey)}
                  onCheckedChange={() => toggleBiasRating(biasRatingKey)}
                >
                  {biasKeyToLabel(biasRatingKey)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-surface text-primary w-[120px] font-semibold !outline-none md:w-[240px]">
              <SelectValue placeholder="Razvrsti po" />
            </SelectTrigger>
            <SelectContent className="bg-surface text-primary shadow-vidik">
              <SelectItem value="rank" className="hover:bg-surface-light/10">
                Privzeto
              </SelectItem>
              <SelectItem
                value="month-most"
                className="hover:bg-surface-light/10"
              >
                Največ člankov
              </SelectItem>
              <SelectItem
                value="month-least"
                className="hover:bg-surface-light/10"
              >
                Najmanj člankov
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {filteredAndSortedProviders.map((provider) => (
          <Link
            className="bg-surface-light/50 shadow-vidik flex flex-col items-start justify-between gap-4 rounded-md p-4 transition-all hover:bg-current/5"
            to={href("/medij/:providerKey", { providerKey: provider.key })}
            key={provider.key}
          >
            <div className="flex w-full flex-col">
              <div className="flex items-center gap-4">
                <ProviderImage
                  className="shadow-vidik size-[60px] rounded-md"
                  size={160}
                  provider={provider}
                ></ProviderImage>

                <div className="flex flex-col gap-2">
                  <h2
                    className={cn("mt-2 ml-1 text-[20px] leading-6 font-bold")}
                  >
                    {provider.name}
                  </h2>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <div className="bg-surface-light/70 shadow-vidik hover:bg-surface-light text-surface-light-text flex items-center justify-center gap-1 rounded-lg border border-current/10 px-2 py-1 text-xs font-semibold">
                      <Globe className="size-3" />
                      {removeUrlProtocol(provider.url)}
                    </div>
                    <div
                      className={`${biasKeyToColor(provider.biasRating ?? "")} shadow-vidik flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold`}
                    >
                      <ArrowLeftRight className="size-3" />
                      {biasKeyToLabel(provider.biasRating ?? "")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <h2 className="text-primary/50 font-ligh">
                Članki objavljeni ta mesec:{" "}
                {providerStatsMap.get(provider.key)?.month.count ?? 0}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return getSeoMetas({
    title: "Mediji | Vidik",
    description: "Novičarske organizacije, ki jih podpira Vidik",
    pathname: location.pathname,
    keywords: "vidik, mediji, novičarske organizacije",
    ogType: "website",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
