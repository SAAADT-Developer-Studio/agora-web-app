import { data, Link, href } from "react-router";
import type { Route } from "./+types/provider";
import { getSeoMetas } from "~/lib/seo";
import { CircleCheck, Globe, Newspaper, Info } from "lucide-react";
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

const BiasRating = {
  Left: "left",
  CenterLeft: "center-left",
  Center: "center",
  CenterRight: "center-right",
  Right: "right",
} as const;

type BiasRating = (typeof BiasRating)[keyof typeof BiasRating];

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context;

  const provider = await db.query.newsProvider.findFirst({
    where: (provider, { eq }) => eq(provider.key, params.providerKey),
  });

  if (!provider) {
    throw new Response("Provider not found", { status: 404 });
  }

  const stats = await getProviderStats(db, params.providerKey);

  return data({ provider, stats }, {});
}

function biasKeyToColor(biasKey: string) {
  const biasMap = {
    left: "bg-[#FA2D36]",
    "center-left": "bg-[#FF6166]",
    center: "bg-[#FEFFFF] !text-black",
    "center-right": "bg-[#52A1FF]",
    right: "bg-[#2D7EFF]",
  } satisfies Record<BiasRating, string>;

  return biasMap[biasKey as BiasRating] || "#FFFFFF";
}

export default function ProviderPage({ loaderData }: Route.ComponentProps) {
  const { provider, stats } = loaderData;
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
          className="h-[160px] min-w-[160px] rounded-lg"
        />
        <div className="ml-3 flex flex-col justify-between md:ml-6">
          <div className="flex flex-wrap gap-2">
            <a
              href={provider.url}
              target="_blank"
              className="bg-foreground/70 hover:bg-foreground text-primary flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold md:gap-2 md:px-3 md:py-2 md:text-lg"
            >
              <Globe className="size-3 md:size-5" />
              {removeUrlProtocol(provider.url)}
            </a>
            <Link
              to={href("/metodologija")}
              className={`${biasKeyToColor(provider.biasRating ?? "")} text-vidikwhite flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold md:gap-2 md:px-3 md:py-2 md:text-lg`}
            >
              <Info className="size-3 md:size-5" />
              {biasKeyToLabel(provider.biasRating ?? "")}
            </Link>
          </div>
          <h1 className="text-[30px] font-bold sm:text-[40px] md:text-[100px]">
            {provider.name}
          </h1>
        </div>
      </div>
      <div>
        <h2 className="text-primary mt-4 text-lg font-bold md:text-2xl">
          Se ne strinjaš da {provider.name} spada pod{" "}
          {biasKeyToLabel(provider.biasRating ?? "")}?
        </h2>
        <p className="text-primary/50 text-sm md:text-lg">
          Glasuj kam spada na političnem spektru
        </p>
      </div>
      <div className="mt-4 grid w-full grid-cols-5 gap-2">
        {Object.entries(BiasRating).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleClick(value)}
            disabled={mutation.isPending}
            className={cn(
              "text-vidikwhite transition-duration-200 relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-center text-sm leading-4 font-semibold transition-transform hover:scale-102 md:text-xl md:leading-5",
              biasKeyToColor(value),
              voteValue === value && "border-2 border-white",
            )}
          >
            {biasKeyToLabel(value)}
            {voteValue === value && (
              <span className="absolute top-2 right-2">
                {mutation.isPending ? (
                  <Spinner className="size-[25px] fill-current" />
                ) : (
                  <CircleCheck size={25} />
                )}
              </span>
            )}
          </button>
        ))}
      </div>
      {voteValue && !voteSuggestions.isError && (
        <div className="animate-in slide-in-from-top-4 fade-in mt-12 duration-500">
          <h2 className="text-primary text-lg font-bold md:text-2xl">
            Glasuj še za druge medije!
          </h2>
          <div className="mt-6 grid w-full grid-cols-2 items-center gap-4 sm:grid-cols-3 md:grid-cols-5">
            {voteSuggestions.isLoading && (
              <Spinner className="col-span-5 m-auto size-8" />
            )}
            {voteSuggestions.data?.providers.map((p) => (
              <Link
                key={p.key}
                to={href("/medij/:providerKey", { providerKey: p.key })}
                className="flex items-center justify-center"
              >
                <div
                  className="relative size-[160px] cursor-pointer rounded-lg bg-cover bg-center transition-transform duration-200 hover:scale-102"
                  style={{
                    backgroundImage: `url(${getProviderImageUrl(p.key, 160)})`,
                  }}
                >
                  <div
                    className={
                      "absolute top-[-5px] right-[-10px] rounded-lg px-2 py-1 text-sm font-semibold " +
                      biasKeyToColor(p.biasRating ?? "")
                    }
                  >
                    {biasKeyToLabel(p.biasRating ?? "")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="bg-foreground border-none !py-0">
          <div className="space-y-4 p-8">
            <div className="flex justify-end">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-7xl font-bold text-white">
                {stats.today.count}
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-lg leading-tight font-medium text-white">
                Objavljenih člankov danes
              </p>
              <p className="text-sm text-gray-400">Rank: #{stats.today.rank}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-foreground border-none !py-0">
          <div className="space-y-4 p-8">
            <div className="flex justify-end">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-7xl font-bold text-white">
                {stats.week.count}
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-lg leading-tight font-medium text-white">
                Objavljenih člankov ta teden
              </p>
              <p className="text-sm text-gray-400">Rank: #{stats.week.rank}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-foreground border-none !py-0">
          <div className="space-y-4 p-8">
            <div className="flex justify-end">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-7xl font-bold text-white">
                {stats.month.count}
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-lg leading-tight font-medium text-white">
                Objavljenih člankov ta mesec
              </p>
              <p className="text-sm text-gray-400">Rank: #{stats.month.rank}</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function meta({ data, location }: Route.MetaArgs) {
  const { provider } = data;

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
