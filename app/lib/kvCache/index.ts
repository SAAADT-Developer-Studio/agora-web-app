import type { CacheKey } from "~/lib/kvCache/keys";
import { getEnv } from "~/utils/getEnv";

type EntryMetadata = { storedAt: number };

/** Keys this isolate is already refreshing, so concurrent stale hits refresh once. */
const refreshing = new Set<string>();

export class KVCache {
  constructor(
    private cfCache: KVNamespace,
    private ctx: ExecutionContext,
  ) {}

  /**
   * Stale-while-revalidate read. A value older than `staleAfter` seconds is
   * still returned immediately and refreshed in the background, so visitors
   * only wait on `fn` when the key is missing entirely (expired after
   * `expirationTtl` or never written).
   */
  async cached<T>(
    fn: () => Promise<T>,
    {
      key,
      staleAfter,
      expirationTtl,
    }: {
      key: CacheKey;
      staleAfter: number;
      expirationTtl: number;
    },
  ): Promise<T> {
    const fullKey = this.getFullKey(key);
    const { value, metadata } =
      await this.cfCache.getWithMetadata<EntryMetadata>(fullKey);

    if (value !== null) {
      // Entries written before metadata existed count as stale.
      const age = Date.now() - (metadata?.storedAt ?? 0);
      if (age > staleAfter * 1000 && !refreshing.has(fullKey)) {
        refreshing.add(fullKey);
        this.ctx.waitUntil(
          fn()
            .then((fresh) => this.put(key, fresh, { expirationTtl }))
            .catch((err) => console.error(`KV refresh failed for ${key}`, err))
            .finally(() => refreshing.delete(fullKey)),
        );
      }
      return JSON.parse(value) as T;
    }

    const response = await fn();
    this.putDeferred(key, response, { expirationTtl });

    return response;
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const serializedValue = await this.cfCache.get(fullKey);
    if (serializedValue !== null) {
      return JSON.parse(serializedValue) as T;
    }
    return null;
  }

  async put<T>(key: CacheKey, value: T, options?: KVNamespacePutOptions) {
    const fullKey = this.getFullKey(key);
    await this.cfCache.put(fullKey, JSON.stringify(value), {
      ...options,
      metadata: { storedAt: Date.now() } satisfies EntryMetadata,
    });
  }

  putDeferred<T>(key: CacheKey, value: T, options?: KVNamespacePutOptions) {
    this.ctx.waitUntil(this.put(key, value, options));
  }

  getFullKey(key: string) {
    const env = getEnv();
    return `${env}:${key}`;
  }
}
