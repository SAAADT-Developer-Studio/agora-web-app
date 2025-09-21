import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { parse } from "pg-connection-string";

const { database, host, port, password, user } = parse(process.env.DB_URL!);

export default defineConfig({
  out: "./app/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // using url doesn't work because it seems to override the ssl config
    // url: process.env.DB_URL!,
    host: host!,
    port: parseInt(port!),
    user: user!,
    password: password!,
    database: database!,
    ssl: {
      ca: process.env.DB_CERT,
    },
  },
});
