import { getEnv } from "~/utils/getEnv";

export class KVCache {
  constructor(
    private cfCache: KVNamespace,
    private ctx: ExecutionContext,
  ) {}

  async cached<T>(
    fn: () => Promise<T>,
    {
      key,
      expirationTtl,
    }: {
      key: string;
      expirationTtl: number;
    },
  ): Promise<T> {
    const value = await this.get<T>(key);

    if (value !== null) {
      return value;
    }

    const response = await fn();
    this.putDeferred(key, response, { expirationTtl });

    return response;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const serializedValue = await this.cfCache.get(fullKey);
    if (serializedValue !== null) {
      return JSON.parse(serializedValue) as T;
    }
    return null;
  }

  async put<T>(key: string, value: T, options?: KVNamespacePutOptions) {
    const fullKey = this.getFullKey(key);
    await this.cfCache.put(fullKey, JSON.stringify(value), options);
  }

  putDeferred<T>(key: string, value: T, options?: KVNamespacePutOptions) {
    const fullKey = this.getFullKey(key);
    this.ctx.waitUntil(
      this.cfCache.put(fullKey, JSON.stringify(value), options),
    );
  }

  getFullKey(key: string) {
    const env = getEnv();
    return `${env}:${key}`;
  }
}
