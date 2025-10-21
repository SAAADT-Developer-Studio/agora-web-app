import { ChartBar } from "lucide-react";
import { Suspense } from "react";
import { Await } from "react-router";
import { ProviderImage } from "~/components/provider-image";
import { SideCardContainer, SideCardHeader } from "~/components/ui/side-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
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
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-white/60 p-2">
            <ChartBar className="size-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg leading-5 font-bold">Članki po medijih</p>
            <span className="text-xs">Zadnji teden</span>
          </div>
        </div>
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
    <div className="flex flex-col gap-3 px-5 pb-4 md:pb-0">
      {providerStats.map((provider) => {
        return (
          <div className="group flex gap-2" key={provider.key}>
            <Tooltip>
              <TooltipTrigger>
                {/* TODO: create a common provider image component, that handles building the url */}
                <ProviderImage
                  provider={provider}
                  className="size-8 overflow-clip rounded border-2 border-black/20 transition-all group-hover:border-black/40 dark:border-white/70 dark:group-hover:border-white"
                />
              </TooltipTrigger>
              <TooltipContent side="left">{provider.name}</TooltipContent>
            </Tooltip>
            <div className="flex flex-1 rounded-md bg-black/5 dark:bg-[#5a5a5a]">
              <div
                className="bg-electricblue flex h-8 items-center justify-end rounded-md px-2 font-semibold text-white transition-all group-hover:shadow-[0_0_8px_var(--color-electricblue)]"
                style={{
                  width: `${(provider.articleCount / maxArticles) * 100}%`,
                }}
              >
                {provider.articleCount}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
