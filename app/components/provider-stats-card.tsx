import { ChartBar } from "lucide-react";
import { Suspense } from "react";
import { Await, href, Link } from "react-router";
import { ProviderImage } from "~/components/provider-image";
import { ErrorUI } from "~/components/ui/error-ui";
import { SideCardContainer, SideCardHeader } from "~/components/ui/side-card";
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { getProviderStats } from "~/lib/services/homePageProviderStats";

export function ProviderStatsCard({
  providerStatsPromise,
}: {
  providerStatsPromise: ReturnType<typeof getProviderStats>;
}) {
  return (
    <SideCardContainer>
      <SideCardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-current/15 p-2 dark:bg-current/10">
            <ChartBar className="size-5" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg leading-5 font-bold">Članki po medijih</p>
            <span className="text-xs">Zadnji teden</span>
          </div>
        </div>
      </SideCardHeader>

      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-8" />
          </div>
        }
      >
        <Await
          resolve={providerStatsPromise}
          errorElement={
            <ErrorUI message="Napaka pri nalaganju statistik" size="small" />
          }
        >
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
          <div key={provider.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={href("/medij/:providerKey", {
                    providerKey: provider.key,
                  })}
                  className="group flex gap-2"
                  prefetch="intent"
                >
                  <ProviderImage
                    provider={provider}
                    className="size-8 overflow-clip rounded border-2 border-black/20 transition-all group-hover:border-black/40 dark:border-white/70 dark:group-hover:border-white"
                  />

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
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">{provider.name}</TooltipContent>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
