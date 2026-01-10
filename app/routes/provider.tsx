import { data, Link, href, Await } from "react-router";
import type { Route } from "./+types/provider";
import { getSeoMetas } from "~/lib/seo";
import {
  CircleCheck,
  Globe,
  Newspaper,
  Clock,
  Eye,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  getProviderImageUrl,
  ProviderImage,
} from "~/components/provider-image";
import { ErrorComponent } from "~/components/error-component";

import { Card } from "~/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "~/lib/fetcher";
import type { VoteInput } from "~/routes/api/post-vote";
import { type Vote } from "~/routes/api/get-vote";
import { cn } from "~/lib/utils";
import { removeUrlProtocol } from "~/utils/removeUrlProtocol";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "sonner";
import type { ProviderSuggestionsData } from "~/routes/api/get-provider-suggestions";
import { getProviderStats } from "~/lib/services/providerPageProviderStats";
import { Suspense } from "react";
import { ErrorUI } from "~/components/ui/error-ui";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { BiasRatingKey, type BiasRating } from "~/enums/biasRatingKey";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import { mossData as mossDataTable, article, vote } from "~/drizzle/schema";
import { timeDiffInSlovenian } from "~/utils/timeDiffInSlovenian";
import { sql } from "drizzle-orm";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context;

  const provider = await db.query.newsProvider.findFirst({
    where: (provider: { key: any }, { eq }: any) =>
      eq(provider.key, params.providerKey),
  });

  if (!provider) {
    throw new Response("Provider not found", { status: 404 });
  }

  const stats = context.measurer.time("get-provider-stats", async () => {
    return await getProviderStats(db, params.providerKey);
  });

  const mossData = context.measurer.time("get-moss-data", async () => {
    return await db.query.mossData.findFirst({
      where: (mossData, { eq }) => eq(mossData.providerKey, params.providerKey),
      orderBy: (mossData, { desc }) => [desc(mossData.createdAt)],
    });
  });

  const latestArticle = await context.measurer.time(
    "get-latest-article",
    async () => {
      return await db.query.article.findFirst({
        where: (article, { eq }) =>
          eq(article.newsProviderKey, params.providerKey),
        orderBy: (article, { desc }) => [desc(article.publishedAt)],
      });
    },
  );

  const numberOfVotesByBias = await db
    .select({
      providerId: vote.providerId,
      biasKey: vote.value,
      votes: sql<number>`count(*)`,
    })
    .from(vote)
    .groupBy(vote.providerId, vote.value);

  return data(
    { provider, stats, mossData, latestArticle, numberOfVotesByBias },
    {},
  );
}

export default function ProviderPage({ loaderData }: Route.ComponentProps) {
  const { provider, stats, mossData, latestArticle, numberOfVotesByBias } =
    loaderData;
  const queryClient = useQueryClient();
  const [userId] = useLocalStorage("user_id", null);

  const queryKey = ["vote", provider.key, userId];

  const voteResult = useQuery({
    queryKey,
    queryFn: async () => {
      return await get<Vote | undefined>(
        href("/api/votes/:providerKey/:userId", {
          providerKey: provider.key,
          userId,
        }),
      );
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (value: BiasRating) => {
      await post(href("/api/votes"), {
        providerKey: provider.key,
        userId,
        value,
      } satisfies VoteInput);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
    onMutate(ratingValue) {
      queryClient.setQueryData(queryKey, (old: Vote) => ({
        ...old,
        value: ratingValue,
      }));
    },
    onError(error) {
      toast.error("Prišlo je do napake pri glasovanju. Poskusi znova.");
      window.posthog?.capture("vote_error", {
        providerKey: provider.key,
        userId,
        error: error.message,
        stack: error.stack,
      });
    },
  });

  const voteSuggestions = useQuery({
    queryKey: ["provider-suggestions", provider.key, userId],
    queryFn: async () => {
      return await get<ProviderSuggestionsData>(
        href("/api/provider-suggestions/:providerKey/:userId", {
          userId,
          providerKey: provider.key,
        }),
      );
    },
    enabled: !!userId,
  });

  const handleClick = (value: BiasRating) => {
    mutation.mutate(value);
  };

  const voteValue = voteResult.data?.value;

  return (
    <section>
      <div className="flex">
        <ProviderImage
          size={160}
          provider={provider}
          className={cn(
            "h-[120px] min-w-[120px] rounded-lg",
            provider.key === "zurnal24" && "border border-white/20",
          )}
        />
        <div className="ml-3 flex flex-col justify-between md:ml-4">
          <div className="flex flex-wrap gap-2">
            <a
              href={provider.url}
              target="_blank"
              className="bg-surface-light/70 hover:bg-surface-light text-surface-light-text flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
            >
              <Globe className="size-3" />
              {removeUrlProtocol(provider.url)}
            </a>
            <div
              className={cn(
                "bg-surface-light/70 hover:bg-surface-light text-surface-light-text flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                biasKeyToColor(provider.biasRating ?? ""),
              )}
            >
              <BiasInfoTooltip iconClassName="size-3" />
              {biasKeyToLabel(provider.biasRating ?? "")}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[35px] leading-none font-bold">
              {provider.name}
            </h1>
            <p className="text-primary/50 text-[15px] font-light sm:text-[20px]">
              {latestArticle?.publishedAt
                ? `Zadnji članek objavljen ${timeDiffInSlovenian(new Date(latestArticle.publishedAt))}`
                : "Ni podatkov o zadnjem članku"}
            </p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-surface-text mt-4 text-lg font-bold md:text-2xl">
          Se ne strinjaš da {provider.name} spada pod{" "}
          {biasKeyToLabel(provider.biasRating ?? "")}?
        </h2>
        <p className="text-surface-text/50 text-sm md:text-lg">
          Glasuj kam spada na političnem spektru
        </p>
      </div>
      <div className="mt-4 grid w-full gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Object.entries(BiasRatingKey).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleClick(value)}
            disabled={mutation.isPending}
            className={cn(
              "@container",
              "text-surface-text/70 bg-primary/5 border-primary/10 hover:bg-primary/8 transition-duration-200 shadow-vidik relative flex h-[60px] cursor-pointer items-center justify-start rounded-md border px-[10px] py-[5px] text-center text-sm leading-4 font-semibold transition-colors focus:outline-none active:scale-100 md:text-xl md:leading-5",

              voteValue === value && "border-surface-text/30 border-1",
            )}
          >
            <div
              className={`aspect-square h-2/3 rounded-sm ${biasKeyToColor(value, true)}`}
            ></div>
            <div className="ml-3 flex h-2/3 flex-col items-start justify-between">
              <p className="text-surface-text text-sm capitalize">
                {biasKeyToLabel(value)}
              </p>
              <p className="text-primary/50 text-xs font-light">
                {` ${numberOfVotesByBias.find((v) => v.providerId === provider.key && v.biasKey === value)?.votes ?? 0} glasov`}{" "}
              </p>
            </div>
            {voteValue === value && (
              <span
                className={cn(
                  "absolute top-0.5 right-0.5",
                  "@min-[90px]:top-2 @min-[90px]:right-2 @min-[90px]:block",
                )}
              >
                {mutation.isPending ? (
                  <Spinner className="size-2 fill-current font-light @min-[90px]:size-[8px]" />
                ) : (
                  <CircleCheck className="size-5 @min-[90px]:size-[25px]" />
                )}
              </span>
            )}
          </button>
        ))}
      </div>
      {voteValue && !voteSuggestions.isError && (
        <div className="animate-in slide-in-from-top-4 fade-in mt-12 duration-500">
          <h2 className="text-surface-text text-lg font-bold md:text-2xl">
            Glasuj še za druge medije!
          </h2>
          <div className="mt-6 grid w-full grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {voteSuggestions.isLoading && (
              <Spinner className="col-span-5 m-auto size-8" />
            )}
            {voteSuggestions.data?.providers.map((p) => (
              <Link
                key={p.key}
                to={href("/medij/:providerKey", { providerKey: p.key })}
                className="flex items-center justify-center"
                prefetch="intent"
              >
                <div className="bg-primary/5 hover:bg-primary/8 border-primary/10 shadow-vidik relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border bg-cover bg-center pt-[15px] pb-[10px] transition-colors duration-200">
                  <div
                    style={{
                      backgroundImage: `url(${getProviderImageUrl(p.key, 160)})`,
                    }}
                    className="relative size-[160px] rounded-lg bg-cover bg-center"
                  >
                    <div
                      className={`shadow-vidik absolute -top-2 right-3 rounded-md px-2 ${biasKeyToColor(p.biasRating ?? "")}`}
                    >
                      <p className="xs">{biasKeyToLabel(p.biasRating ?? "")}</p>
                    </div>
                  </div>
                  <p className="text-primary mt-[10px] text-sm font-semibold">
                    {p.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-primary mt-10 text-lg font-bold md:text-2xl">
        Statistika
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<Spinner className="col-span-5 m-auto size-8" />}>
          <Await
            resolve={Promise.all([stats, mossData])}
            errorElement={
              <ErrorUI
                message="Napaka pri nalaganju statistik"
                size="small"
                className="col-span-5"
              />
            }
          >
            {([statsResolved, mossDataResolved]) => (
              <ProviderStatsCards
                stats={statsResolved}
                mossData={mossDataResolved}
              />
            )}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const provider = loaderData?.provider;

  if (!provider) {
    return getSeoMetas({
      title: "Provider Not Found",
      description: "The requested news provider could not be found.",
      pathname: location.pathname,
    });
  }

  return getSeoMetas({
    title: provider.name,
    description:
      "Več informacij o " +
      provider.name +
      " in njegovi oceni medijske pristranskosti.",
    image: getProviderImageUrl(provider.key),
    pathname: location.pathname,
    keywords: `${provider.name}, medijska pristranskost, mediji`,
    ogType: "article",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}

function ProviderStatsCards({
  stats,
  mossData,
}: {
  stats: Awaited<ReturnType<typeof getProviderStats>>;
  mossData: typeof mossDataTable.$inferSelect | null | undefined;
}) {
  return (
    <>
      <Card
        key="articles-today"
        className="bg-primary/5 border-primary/10 shadow-vidik p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Newspaper className="size-5 text-blue-500" />
            </div>
            <span className="text-primary/50 text-xs">
              #{stats.today.rank || "N/A"}
            </span>
          </div>
          <div>
            <p className="text-primary/60 mb-2 text-xs">Članki danes:</p>
            <h3 className="text-primary text-4xl leading-none font-bold">
              {stats.today.count}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-primary/60 text-xs">Ta teden:</p>
              <p className="text-primary text-2xl font-semibold">
                {stats.week.count}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-primary/60 text-xs">Ta mesec:</p>
              <p className="text-primary text-2xl font-semibold">
                {stats.month.count}
              </p>
            </div>
            <div></div>
          </div>
        </div>
      </Card>

      {mossData && (
        <Card
          key="reach"
          className="bg-primary/5 border-primary/10 shadow-vidik p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Target className="size-5 text-purple-500" />
              </div>
              <span className="text-primary/50 text-xs">
                #{mossData?.rank || "N/A"}
              </span>
            </div>
            <div>
              <p className="text-primary/60 mb-2 text-xs">Doseg ta mesec:</p>
              <h3 className="text-primary text-4xl leading-none font-bold">
                {mossData?.reach.toLocaleString() || "N/A"}
              </h3>
            </div>
            <div className="bg-primary/10 h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(mossData?.reachPercent || 0, 100)}%`,
                }}
              />
            </div>
            <p className="text-primary/50 text-xs">
              Dnevno povprečje:{" "}
              {mossData?.avgDailyReach.toLocaleString() || "N/A"}
            </p>
          </div>
        </Card>
      )}

      {mossData && (
        <Card
          key="views"
          className="bg-primary/5 border-primary/10 shadow-vidik border p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <Eye className="size-5 text-green-500" />
              </div>
              <span className="text-primary/50 text-xs">
                #{mossData?.rank || "N/A"}
              </span>
            </div>
            <div>
              <p className="text-primary/60 mb-2 text-xs">Ogledi ta mesec:</p>
              <h3 className="text-primary text-4xl leading-none font-bold">
                {mossData?.views.toLocaleString() || "N/A"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="text-primary/60 size-3.5" />
              <p className="text-primary/60 text-xs">
                Trend:{" "}
                {mossData?.trend ? `${mossData.trend.toFixed(1)}%` : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {mossData && (
        <Card
          key="session-duration"
          className="bg-primary/5 border-primary/10 shadow-vidik p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Clock className="size-5 text-orange-500" />
              </div>
              <span className="text-primary/50 text-xs">
                #{mossData?.rank || "N/A"}
              </span>
            </div>
            <div>
              <p className="text-primary/60 mb-2 text-xs">Čas seje:</p>
              <h3 className="text-primary text-4xl leading-none font-bold">
                {mossData?.avgSessionDuration || "N/A"}
              </h3>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
