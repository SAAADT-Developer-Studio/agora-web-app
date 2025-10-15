import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { env } from "cloudflare:workers";
import * as schema from "~/drizzle/schema";
import * as relations from "~/drizzle/relations";

import { Client } from "pg";

export type Database = NodePgDatabase<typeof schema & typeof relations>;

export async function getDb() {
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    return drizzle(client, { schema: { ...schema, ...relations } });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
}
