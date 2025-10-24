import { vote } from "~/drizzle/schema";
import type { Route } from "./+types/post-vote";

import { z } from "zod";
import { data } from "react-router";

const VoteSchema = z.object({
  value: z.enum(["left", "center-left", "center", "center-right", "right"]),
  providerKey: z.string(),
  userId: z.uuid(),
});

export type VoteInput = z.infer<typeof VoteSchema>;

export async function action({ request, context }: Route.ActionArgs) {
  const body = await request.json();
  const result = VoteSchema.safeParse(body);

  if (!result.success) {
    return data(
      { success: false, errors: z.treeifyError(result.error) },
      { status: 400 },
    );
  }

  const { providerKey, userId, value } = result.data;

  const { db } = context;

  await context.measurer.time("post-vote-db-insert", async () => {
    await db
      .insert(vote)
      .values({
        userId,
        providerId: providerKey,
        value,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [vote.userId, vote.providerId],
        set: {
          value,
          createdAt: new Date().toISOString(),
        },
      });
  });

  return data({ success: true }, { status: 200 });
}
