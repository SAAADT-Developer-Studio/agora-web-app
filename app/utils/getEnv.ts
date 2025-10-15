import { env } from "cloudflare:workers";

export function getEnv() {
  return env.ENVIRONMENT;
}
