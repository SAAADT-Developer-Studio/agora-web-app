import { data, Link, href, useRevalidator } from "react-router";
import type { Route } from "./+types/provider";
import {
  breadcrumbJsonLd,
  getSeoMetas,
  newsMediaOrganizationJsonLd,
  SITE_URL,
} from "~/lib/seo";
import { ArrowLeft, CircleCheck, Globe } from "lucide-react";
import { getProviderImageUrl } from "~/components/provider-image";
import { ErrorComponent } from "~/components/error-component";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "~/lib/fetcher";
import type { VoteInput } from "~/routes/api/post-vote";
import { type Vote } from "~/routes/api/get-vote";
import { cn } from "~/lib/utils";
import { removeUrlProtocol } from "~/utils/removeUrlProtocol";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import { biasSide } from "~/utils/biasSide";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "sonner";
import type { ProviderSuggestionsData } from "~/routes/api/get-provider-suggestions";
import { BiasRatingKey, type BiasRating } from "~/enums/biasRatingKey";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import { vote } from "~/drizzle/schema";
import { RelativeTime } from "~/components/render-clock";
import { getAppContext } from "~/lib/appContext";
import { eq, sql } from "drizzle-orm";
import { Page, PageHeader } from "~/components/page";
import { MEDIA_LANDSCAPE_CACHE_KEY } from "~/lib/kvCache/keys";
import {
  LANDSCAPE_TTL_SECONDS,
  fetchMediaLandscape,
  summarizeVotes,
} from "~/lib/services/mediaLandscape";
import {
  OutletProfile,
  type RelatedOutlet,
} from "~/components/mediji/outlet-profile";
import {
  BIAS_FILL,
  BiasChip,
  LimitedDataNote,
  OutletLogo,
} from "~/components/mediji/shared";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db, kvCache, measurer } = getAppContext(context);

  const [provider, landscape, latestArticle, voteRows] = await Promise.all([
    db.query.newsProvider.findFirst({
      where: (p) => eq(p.key, params.providerKey),
    }),
    measurer.time("fetchMediaLandscape", () =>
      kvCache.cached(() => fetchMediaLandscape(db), {
        key: MEDIA_LANDSCAPE_CACHE_KEY,
        expirationTtl: LANDSCAPE_TTL_SECONDS,
      }),
    ),
    db.query.article.findFirst({
      columns: { publishedAt: true },
      where: (a) => eq(a.newsProviderKey, params.providerKey),
      orderBy: (a, { desc }) => [desc(a.publishedAt)],
    }),
    // Live, not from the cached landscape, so a vote shows up right away.
    db
      .select({ value: vote.value, votes: sql<number>`count(*)::int` })
      .from(vote)
      .where(eq(vote.providerId, params.providerKey))
      .groupBy(vote.value),
  ]);

  const outlet = landscape.outlets.find((o) => o.key === params.providerKey);
  if (!provider || !outlet) {
    throw new Response("Provider not found", { status: 404 });
  }

  outlet.votes = summarizeVotes(
    Object.fromEntries(voteRows.map((r) => [r.value, Number(r.votes)])),
    biasSide(provider.biasRating),
  );

  const relatedKeys = new Set([
    ...outlet.similar.map((s) => s.key),
    ...(outlet.counterpart ? [outlet.counterpart.key] : []),
  ]);
  const related: Record<string, RelatedOutlet> = {};
  for (const o of landscape.outlets) {
    if (relatedKeys.has(o.key) || (outlet.owner && o.owner === outlet.owner)) {
      related[o.key] = {
        key: o.key,
        name: o.name,
        biasRating: o.biasRating,
        owner: o.owner,
      };
    }
  }

  return data({
    provider,
    outlet,
    related,
    bigStoriesTotal: landscape.bigStories.length,
    windowDays: landscape.windowDays,
    latestArticleAt: latestArticle?.publishedAt ?? null,
  });
}

export default function ProviderPage({ loaderData }: Route.ComponentProps) {
  const {
    provider,
    outlet,
    related,
    bigStoriesTotal,
    windowDays,
    latestArticleAt,
  } = loaderData;
  const queryClient = useQueryClient();
  const [userId] = useLocalStorage<string | null>("user_id", null);
  const revalidator = useRevalidator();

  const queryKey = ["vote", provider.key, userId];

  const voteResult = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return undefined;
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
      if (!userId) return;
      await post(href("/api/votes"), {
        providerKey: provider.key,
        userId,
        value,
      } satisfies VoteInput);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await revalidator.revalidate();
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
      if (!userId) return undefined;
      return await get<ProviderSuggestionsData>(
        href("/api/provider-suggestions/:providerKey/:userId", {
          userId,
          providerKey: provider.key,
        }),
      );
    },
    enabled: !!userId,
  });

  const voteValue = voteResult.data?.value;

  return (
    <Page>
      <PageHeader
        title={provider.name}
        media={<OutletLogo outlet={provider} className="size-16 md:size-24" />}
        before={
          <Link
            to={href("/mediji")}
            className="text-primary/60 hover:text-primary mb-2 inline-flex items-center gap-1 text-sm font-semibold"
          >
            <ArrowLeft className="size-3.5" />
            Mediji
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm md:text-base">
          <span className="inline-flex items-center gap-1">
            <BiasChip rating={provider.biasRating} className="text-xs" />
            <BiasInfoTooltip iconClassName="size-3.5" />
          </span>
          {outlet.limitedData && <LimitedDataNote />}
          <a
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-link inline-flex items-center gap-1 font-semibold"
          >
            <Globe className="size-3.5" />
            {removeUrlProtocol(provider.url)}
          </a>
          <span>
            {latestArticleAt ? (
              <>
                Zadnji članek <RelativeTime date={latestArticleAt} />
              </>
            ) : (
              "Ni podatkov o zadnjem članku"
            )}
          </span>
        </div>
      </PageHeader>

      <OutletProfile
        outlet={outlet}
        related={related}
        bigStoriesTotal={bigStoriesTotal}
        windowDays={windowDays}
        voting={
          <div className="mt-4">
            <p className="text-primary/70 text-sm font-semibold">
              Kam po tvoje spada {provider.name}?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.values(BiasRatingKey).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => mutation.mutate(value)}
                  disabled={mutation.isPending}
                  aria-pressed={voteValue === value}
                  className={cn(
                    "text-primary flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-wait",
                    voteValue === value
                      ? "border-primary bg-primary/8"
                      : "hover:border-primary/40 border-current/15",
                  )}
                >
                  <span
                    className={cn("size-2.5 rounded-full", BIAS_FILL[value])}
                  />
                  {biasKeyToLabel(value)}
                  <span className="text-primary/50 font-normal tabular-nums">
                    {outlet.votes.byRating[value]}
                  </span>
                  {voteValue === value &&
                    (mutation.isPending ? (
                      <Spinner className="size-3 fill-current" />
                    ) : (
                      <CircleCheck className="size-4" />
                    ))}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {voteValue && !voteSuggestions.isError && (
        <section className="animate-in slide-in-from-top-4 fade-in mt-12 duration-500">
          <h2 className="text-primary text-xl font-bold md:text-2xl">
            Glasuj še za druge medije
          </h2>
          {voteSuggestions.isLoading && (
            <Spinner className="m-auto mt-6 size-8" />
          )}
          <ul className="mt-4 flex flex-wrap gap-2">
            {voteSuggestions.data?.providers.map((p) => (
              <li key={p.key}>
                <Link
                  to={href("/medij/:providerKey", { providerKey: p.key })}
                  prefetch="intent"
                  className="hover:bg-primary/5 flex items-center gap-2 rounded-lg border border-current/10 py-1 pr-2.5 pl-1 transition-colors"
                >
                  <OutletLogo outlet={p} className="size-8" />
                  <span className="text-sm font-semibold">{p.name}</span>
                  <BiasChip rating={p.biasRating} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const provider = loaderData?.provider;

  if (!provider) {
    return getSeoMetas({
      title: "Medij ni najden | Vidik",
      description: "Zahtevani medij ni bil najden.",
      pathname: location.pathname,
      noindex: true,
      includeSiteSchema: false,
    });
  }

  const biasLabel = provider.biasRating
    ? biasKeyToLabel(provider.biasRating)
    : null;
  const description = biasLabel
    ? `${provider.name} na Vidiku: ocena medijske pristranskosti je ${biasLabel}. Preglejte statistiko poročanja in primerjavo z drugimi slovenskimi mediji.`
    : `${provider.name} na Vidiku: pregled medija, statistika poročanja in ocena medijske pristranskosti.`;

  const pageUrl = new URL(location.pathname, SITE_URL).href;
  const logo = getProviderImageUrl(provider.key);

  return getSeoMetas({
    title: `${provider.name} | Vidik`,
    description,
    image: logo,
    pathname: location.pathname,
    keywords: `${provider.name}, medijska pristranskost, slovenski mediji, vidik`,
    ogType: "website",
    jsonLd: [
      newsMediaOrganizationJsonLd({
        name: provider.name,
        url: pageUrl,
        description,
        logo,
        sameAs: provider.url ? [provider.url] : undefined,
      }),
      breadcrumbJsonLd([
        { name: "Domov", path: "/" },
        { name: "Mediji", path: "/mediji" },
        { name: provider.name, path: location.pathname },
      ]),
    ],
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorComponent error={error} />;
}
