import { ChartBar } from "lucide-react";
import { Suspense } from "react";
import { Await } from "react-router";
import { SideCardContainer, SideCardHeader } from "~/components/ui/side-card";
import { config } from "~/config";
import type { getProviderStats } from "~/lib/services/providerStats";

export function ProviderStatsCard({
  providerStatsPromise,
}: {
  providerStatsPromise: ReturnType<typeof getProviderStats>;
}) {
  return (
    <SideCardContainer>
      <SideCardHeader>
        <ChartBar className="size-5" />
        <p className="font-bold uppercase">Članki po medijih – zadnji teden</p>
      </SideCardHeader>

      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={providerStatsPromise}>
          {(providerStats) => (
            <ProviderStatsChart providerStats={providerStats} />
          )}
        </Await>
      </Suspense>
    </SideCardContainer>
  );
}

function ProviderStatsChart({
  providerStats,
}: {
  providerStats: Awaited<ReturnType<typeof getProviderStats>>;
}) {
  const maxArticles = Math.max(
    ...providerStats.map((provider) => provider.articleCount),
  );

  return (
    <div className="flex flex-col gap-3 px-5">
      {providerStats.map((provider) => {
        return (
          <div className="flex gap-2">
            <div className="">
              <img
                src={`${config.imagesUrl}/providers/${provider.key}.webp`}
                alt={provider.name}
                className="size-8 overflow-clip rounded border border-white"
              />
            </div>
            <div
              className="flex h-8 items-center justify-end rounded-md bg-blue-400 px-2 text-black"
              style={{
                width: `${(provider.articleCount / maxArticles) * 100 - 3}%`,
              }}
            >
              {provider.articleCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}
