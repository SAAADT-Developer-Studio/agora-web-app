import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "~/drizzle/schema";
import * as relations from "~/drizzle/relations";

import { Client } from "pg";

export type Database = NodePgDatabase<typeof schema & typeof relations>;

export async function getDb(connectionString: string) {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    return drizzle(client, {
      schema: { ...schema, ...relations },
    });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
}
