import { ErrorComponent } from "~/components/error-component";
import type { Route } from "./+types/providers";
import { getSeoMetas } from "~/lib/seo";
import { ProviderImage } from "~/components/provider-image";
import { Globe, Info, Newspaper } from "lucide-react";
import { Link, data, href } from "react-router";
import { sql, and, gte, desc, count } from "drizzle-orm";
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

async function getAllProviderStats(db: any): Promise<ProviderStats[]> {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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

/*export function headers() {
  // Prevent caching, for now, since we have some sort of caching issue
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };
} */

export async function loader({ params, context }: Route.LoaderArgs) {
  const { db } = context;

  const providers = await db.query.newsProvider.findMany({
    orderBy: (provider, { asc }) => [asc(provider.rank)],
  });

  const providerStats = await getAllProviderStats(db);

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
        <h2 className="text-primary text-2xl font-bold md:text-5xl">Mediji</h2>

        <div className="mt-4 flex flex-wrap items-start justify-start gap-3 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="bg-primary text-background font-semibold !outline-none"
            >
              <Button variant="outline">
                Pristranskost
                {selectedBiasRatings.length > 0 && (
                  <span className="bg-background text-primary ml-2 rounded-full px-2 py-0.5 text-xs">
                    {selectedBiasRatings.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-primary text-background w-56">
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
            <SelectTrigger className="bg-primary text-background w-[120px] font-semibold !outline-none md:w-[240px]">
              <SelectValue placeholder="Razvrsti po" />
            </SelectTrigger>
            <SelectContent className="bg-primary text-background border-none">
              <SelectItem value="rank" className="hover:bg-foreground/10">
                Privzeto
              </SelectItem>
              <SelectItem value="today-most" className="hover:bg-foreground/10">
                Danes - Največ člankov
              </SelectItem>
              <SelectItem
                value="today-least"
                className="hover:bg-foreground/10"
              >
                Danes - Najmanj člankov
              </SelectItem>
              <SelectItem value="week-most" className="hover:bg-foreground/10">
                Ta teden - Največ člankov
              </SelectItem>
              <SelectItem value="week-least" className="hover:bg-foreground/10">
                Ta teden - Najmanj člankov
              </SelectItem>
              <SelectItem value="month-most" className="hover:bg-foreground/10">
                Ta mesec - Največ člankov
              </SelectItem>
              <SelectItem
                value="month-least"
                className="hover:bg-foreground/10"
              >
                Ta mesec - Najmanj člankov
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedProviders.map((provider) => (
        <Link
          className="hover:bg-foreground/30 mt-6 flex flex-col items-start justify-between gap-4 rounded-lg p-0 transition-all md:flex-row md:gap-0 md:p-4"
          to={href("/medij/:providerKey", { providerKey: provider.key })}
          key={provider.key}
        >
          <div className="flex w-full">
            <ProviderImage
              size={160}
              provider={provider}
              className={`h-[135px] min-w-[135px] rounded-lg ${provider.key === "zurnal24" ? "border-primary border" : ""}`}
            />
            <div className="@container ml-3 flex w-full flex-col justify-between md:ml-6">
              <div className="flex flex-wrap gap-2">
                <a
                  href={provider.url}
                  target="_blank"
                  className="bg-foreground/70 hover:bg-foreground text-primary flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
                >
                  <Globe className="size-3" />
                  {removeUrlProtocol(provider.url)}
                </a>
                <Link
                  to={href("/metodologija")}
                  className={`${biasKeyToColor(provider.biasRating ?? "")} flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold`}
                >
                  <Info className="size-3" />
                  {biasKeyToLabel(provider.biasRating ?? "")}
                </Link>
              </div>
              <h1 className="text-[20px] leading-6 font-bold @min-[180px]:text-[35px] @min-[180px]:leading-8 @min-[400px]:text-[40px] @min-[400px]:leading-10">
                {provider.name}
              </h1>
            </div>
          </div>
          <div
            className={`grid w-full grid-cols-3 gap-2 md:w-1/2 md:min-w-1/2 ${provider.key === "mladina" ? "hidden" : ""}`}
          >
            <Card className="bg-foreground border-none !py-0">
              <div className="space-y-4 p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary text-md font-bold md:text-xl">
                    {providerStatsMap.get(provider.key)?.today.count ?? 0}
                  </h2>
                  <Newspaper className="text-primary size-3 md:size-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-primary text-xs leading-tight font-medium md:text-sm">
                    Objavljenih člankov danes
                  </p>
                  <p className="text-xs text-gray-400 md:text-sm">
                    Rank: #{providerStatsMap.get(provider.key)?.today.rank}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-foreground border-none !py-0">
              <div className="space-y-4 p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary text-md font-bold md:text-xl">
                    {providerStatsMap.get(provider.key)?.week.count ?? 0}
                  </h2>
                  <Newspaper className="text-primary size-3 md:size-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-primary text-xs leading-tight font-medium md:text-sm">
                    Objavljenih člankov ta teden
                  </p>
                  <p className="text-xs text-gray-400 md:text-sm">
                    Rank: #{providerStatsMap.get(provider.key)?.week.rank}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-foreground border-none !py-0">
              <div className="space-y-4 p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary text-md font-bold md:text-xl">
                    {providerStatsMap.get(provider.key)?.month.count ?? 0}
                  </h2>
                  <Newspaper className="text-primary size-3 md:size-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-primary text-xs leading-tight font-medium md:text-sm">
                    Objavljenih člankov ta mesec
                  </p>
                  <p className="text-xs text-gray-400 md:text-sm">
                    Rank: #{providerStatsMap.get(provider.key)?.month.rank}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Link>
      ))}
    </section>
  );
}

export function meta({
  params,
  location,
}: Route.MetaArgs): Route.MetaDescriptors {
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
