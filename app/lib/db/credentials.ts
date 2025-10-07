import { parse } from "pg-connection-string";

export function getProdCredentials() {
  const { database, host, port, password, user } = parse(process.env.DB_URL!);
  return {
    host: host!,
    port: parseInt(port!),
    user: user!,
    password: password!,
    database: database!,
    ssl: {
      ca: process.env.DB_CERT,
    },
  };
}
