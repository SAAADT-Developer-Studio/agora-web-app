import type { InferSelectModel } from "drizzle-orm";
import { config } from "~/config";
import type { newsProvider } from "~/drizzle/schema";

type BiasRating = "left" | "center-left" | "center" | "center-right" | "right";
type BiasCategory = {
  key: BiasRating;
  barColor: string;
  textColor: string;
};

const biasCategories: BiasCategory[] = [
  {
    key: "left",
    barColor: "bg-blue-500",
    textColor: "text-white",
  },
  {
    key: "center-left",
    barColor: "bg-blue-400",
    textColor: "text-gray-800",
  },
  {
    key: "center",
    barColor: "bg-white",
    textColor: "text-gray-800",
  },
  {
    key: "center-right",
    barColor: "bg-red-300",
    textColor: "text-gray-800",
  },
  {
    key: "right",
    barColor: "bg-red-500",
    textColor: "text-white",
  },
];

export function BiasDistribution({
  biasDistribution: { leftPercent, centerPercent, rightPercent },
  providers,
}: {
  biasDistribution: {
    leftPercent: number;
    centerPercent: number;
    rightPercent: number;
  };
  providers: (InferSelectModel<typeof newsProvider> & {
    articleCount: number;
  })[];
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

  const providersWithoutBias = providers.filter((p) => !p.biasRating);

  console.log({ providersWithoutBias });

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#4a4a4a] p-4 md:col-span-1">
      <h2 className="font-bold tracking-wide text-gray-200 uppercase">
        Distribucija Pristranskosti
      </h2>

      <div className="my-6 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
            Leva
          </div>
          <div className="text-xl font-bold text-gray-100">{leftPercent}%</div>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
            Center
          </div>
          <div className="text-xl font-bold text-gray-100">
            {centerPercent}%
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wider text-red-400 uppercase">
            Desna
          </div>
          <div className="text-xl font-bold text-gray-100">{rightPercent}%</div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-5 gap-2">
        {providersByBias.map((category) => (
          <div
            key={category.key}
            className="flex flex-col overflow-hidden rounded-lg bg-[#2a2a2a]"
          >
            <div className={`h-2 ${category.barColor}`} />
            <div className="px-2 pt-4">
              <div className="flex flex-col items-center gap-2">
                {category.providers.map((provider, idx) => (
                  // TODO: link to provider page
                  <div
                    key={idx}
                    className="border-primary relative flex w-full items-center justify-center rounded-full border-2 bg-blue-600"
                  >
                    <img
                      src={`${config.imagesUrl}/providers/${provider.key}.webp`}
                      alt="Provider"
                      className="h-full w-full overflow-clip rounded-full object-contain"
                    />
                    {provider.articleCount > 1 && (
                      <div className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">
                        {provider.articleCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
