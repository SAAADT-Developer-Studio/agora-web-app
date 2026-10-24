import type { ReactNode } from "react";
import { Blindspots } from "~/components/blindspots";
import CategorySection from "~/components/category-section";
import HeroArticles from "~/components/hero-articles";
import { VotingCard } from "~/components/voting-card";
import { config, defineCategoryMap } from "~/config";
import type { ArticlesByCategory, ArticleType } from "~/lib/services/ranking";
import type { RandomProvider } from "~/lib/services/randomProviders";
import {
  EMPTY_BLINDSPOTS,
  type Blindspots as BlindspotsData,
} from "~/utils/blindspots";

export type HomeFeedArticles = ArticlesByCategory & {
  home: ArticleType[];
  /** Absent in KV entries cached before blindspots existed. */
  blindspots?: BlindspotsData;
};

/** Home layout shared by `/` (cluster_v2) and `/novo` (stories). */
export function HomeFeed({
  articles,
  randomProviders,
}: {
  articles: HomeFeedArticles;
  randomProviders: Promise<RandomProvider[]>;
}) {
  // Explicit null for categories without a side card — adding a CategoryKey
  // forces a decision here via defineCategoryMap.
  const sideSections = defineCategoryMap<ReactNode | null>({
    politika: <VotingCard randomProviders={randomProviders} />,
    gospodarstvo: null,
    kriminal: null,
    lokalno: null,
    sport: null,
    "tehnologija-znanost": null,
    kultura: null,
    zdravje: null,
    okolje: null,
  });

  return (
    <div className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
      <HeroArticles articles={articles.home} />

      <Blindspots blindspots={articles.blindspots ?? EMPTY_BLINDSPOTS} />

      {config.categories.map((category) => (
        <CategorySection
          key={category.key}
          articles={articles[category.key]}
          categoryKey={category.key}
          sideSection={sideSections[category.key] ?? undefined}
        />
      ))}
    </div>
  );
}
