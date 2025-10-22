import { env } from "cloudflare:workers";

export function getEnv() {
  if (import.meta.env.DEV) {
    return "dev";
  }
  return env.ENVIRONMENT;
}
