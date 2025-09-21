import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "cloudflare:workers";
import * as schema from "~/drizzle/schema";
import * as relations from "~/drizzle/relations";

import { parse } from "pg-connection-string";
import { Client } from "pg";

export async function getDb() {
  console.log("Creating new database connection...");

  // const { database, host, port, password, user } = parse(env.DB_URL);

  // console.log({ database, host, port, user, password });
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  // const client = new Client({
  //   // connectionString: process.env.DB_URL,
  //   host,
  //   port: parseInt(port),
  //   user,
  //   password,
  //   database,
  //   ssl: {
  //     rejectUnauthorized: false,
  //     ca: env.DB_CERT,
  //   },
  // });

  try {
    await client.connect();
    return drizzle(client, { schema: { ...schema, ...relations } });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
}
