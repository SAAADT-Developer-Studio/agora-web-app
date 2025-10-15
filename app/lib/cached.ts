import { getEnv } from "~/utils/getEnv";

type CachedOptions = {
  key: string;
  expirationTtl: number;
  cloudflare: {
    env: { VIDIK_CACHE: KVNamespace; [key: string]: any };
    ctx: ExecutionContext;
  };
};

export async function cached<T>(
  fn: () => Promise<T>,
  { key, expirationTtl, cloudflare }: CachedOptions,
): Promise<T> {
  const env = getEnv();
  const fullKey = `${env}:${key}`;
  const cache = cloudflare.env.VIDIK_CACHE;

  const cachedValueStr = await cache.get(fullKey);
  if (cachedValueStr) {
    return JSON.parse(cachedValueStr) as T;
  }

  const response = await fn();

  // Put cache in background without blocking the response
  cloudflare.ctx.waitUntil(
    cache.put(fullKey, JSON.stringify(response), { expirationTtl }),
  );

  return response;
}
