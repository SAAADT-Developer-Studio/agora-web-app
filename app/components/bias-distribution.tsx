import type { InferSelectModel } from "drizzle-orm";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import type { newsProvider } from "~/drizzle/schema";
import { cn } from "~/lib/utils";
import { href, Link } from "react-router";
import { ProviderImage } from "~/components/provider-image";

type BiasRating = "left" | "center-left" | "center" | "center-right" | "right";
type BiasCategory = {
  key: BiasRating;
  barColor: string;
  textColor: string;
};

const biasCategories: BiasCategory[] = [
  {
    key: "left",
    barColor: "bg-red-500",
    textColor: "text-white",
  },
  {
    key: "center-left",
    barColor: "bg-red-300",
    textColor: "text-gray-800",
  },
  {
    key: "center",
    barColor: "bg-gray-300",
    textColor: "text-gray-800",
  },
  {
    key: "center-right",
    barColor: "bg-blue-400",
    textColor: "text-gray-800",
  },
  {
    key: "right",
    barColor: "bg-blue-500",
    textColor: "text-white",
  },
];

export function BiasDistribution({
  biasDistribution: { leftPercent, centerPercent, rightPercent },
  providers,
  className,
}: {
  biasDistribution: {
    leftPercent: number;
    centerPercent: number;
    rightPercent: number;
  };
  providers: (InferSelectModel<typeof newsProvider> & {
    articleCount: number;
  })[];
  className?: string;
}) {
  const providersByBias = biasCategories.map((category) => ({
    ...category,
    providers: providers
      .filter((p) => p.biasRating === category.key)
      .sort((a, b) => {
        const countDiff = b.articleCount - a.articleCount;
        if (countDiff !== 0) return countDiff;
        return a.rank - b.rank; // lower rank is better
      }),
  }));

  return (
    <div
      className={cn(
        "bg-surface-light text-surface-light-text flex flex-col overflow-hidden rounded-lg border border-current/10 p-4 shadow-xs md:col-span-1",
        className,
      )}
    >
      <h2 className="flex items-center justify-between font-bold tracking-wide uppercase">
        Distribucija Pristranskosti
        <BiasInfoTooltip />
      </h2>

      <div className="my-6 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wider text-red-400 uppercase">
            Leva
          </div>
          <div className="text-xl font-bold">{leftPercent}%</div>
        </div>
        <div>
          <div className="dark:text-primary text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Center
          </div>
          <div className="text-center text-xl font-bold">{centerPercent}%</div>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
            Desna
          </div>
          <div className="text-right text-xl font-bold">{rightPercent}%</div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-5 gap-2">
        {providersByBias.map((category) => (
          <div
            key={category.key}
            className="bg-vidikblack/[0.07] dark:bg-surface/50 flex flex-col overflow-hidden rounded-lg pb-2"
          >
            <div className={`h-2 ${category.barColor}`} />
            <div className="px-2 pt-4">
              <div className="flex flex-col items-center gap-2">
                {category.providers.map((provider, idx) => (
                  <ProviderBadge key={idx} provider={provider} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderBadge({
  provider,
}: {
  provider: { key: string; name: string; articleCount: number };
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Link
          to={href("/medij/:providerKey", {
            providerKey: provider.key,
          })}
          prefetch="intent"
        >
          <div className="dark:border-primary border-primary/20 relative flex w-full items-center justify-center rounded-full border-2">
            <ProviderImage
              provider={provider}
              size={60}
              className="h-full w-full overflow-clip rounded-full object-contain"
            />
            {provider.articleCount > 1 && (
              <div className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">
                {provider.articleCount}
              </div>
            )}
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{provider.name}</TooltipContent>
    </Tooltip>
  );
}
