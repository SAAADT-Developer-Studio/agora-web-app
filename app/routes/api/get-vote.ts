import type { Database } from "~/lib/db";
import type { Route } from "./+types/get-vote";
import { data } from "react-router";
import { and, eq } from "drizzle-orm";
import { vote as voteTable } from "~/drizzle/schema";

export async function getVote({
  db,
  providerKey,
  userId,
}: {
  db: Database;
  providerKey: string;
  userId: string;
}) {
  return await db.query.vote.findFirst({
    where: and(
      eq(voteTable.providerId, providerKey),
      eq(voteTable.userId, userId),
    ),
  });
}

export type Vote = NonNullable<Awaited<ReturnType<typeof getVote>>>;

export async function loader({ params, context }: Route.LoaderArgs) {
  return await context.measurer.time("get-vote-loader", async () => {
    const { db } = context;

    const vote = await getVote({
      db,
      providerKey: params.providerKey,
      userId: params.userId,
    });

    // if (!vote) {
    //   throw new Response("Vote not found", { status: 404 });
    // }

    return data(vote);
  });
}
