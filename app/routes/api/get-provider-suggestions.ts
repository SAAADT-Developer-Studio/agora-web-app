import type { Route } from "./+types/get-provider-suggestions";

export type ProviderSuggestionsData = Awaited<ReturnType<typeof loader>>;

export async function loader({ params, context }: Route.LoaderArgs) {
  return await context.measurer.time(
    "get-provider-suggestions-loader",
    async () => {
      const { db } = context;
      const { providerKey, userId } = params;

      const userVotes = await db.query.vote.findMany({
        where: (voteTable, { eq }) => eq(voteTable.userId, userId),
      });

      const votedProviderIds = userVotes.map((vote) => vote.providerId);

      const unvotedProviders = await db.query.newsProvider.findMany({
        where: (newsProviderTable, { notInArray, ne, and }) =>
          and(
            notInArray(newsProviderTable.key, votedProviderIds),
            ne(newsProviderTable.key, providerKey),
          ),
        limit: 5,
        orderBy: (newsProvider) => newsProvider.rank,
      });

      return {
        providers: unvotedProviders,
      };
    },
  );
}
