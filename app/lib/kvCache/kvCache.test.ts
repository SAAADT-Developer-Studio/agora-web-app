import { describe, expect, test, vi } from "vitest";

vi.mock("~/utils/getEnv", () => ({ getEnv: () => "test" }));

const { KVCache } = await import("~/lib/kvCache");
import type { CacheKey } from "~/lib/kvCache/keys";

function fakeKv() {
  const store = new Map<string, { value: string; metadata: unknown }>();
  return {
    store,
    kv: {
      getWithMetadata: async (key: string) =>
        store.get(key) ?? { value: null, metadata: null },
      get: async (key: string) => store.get(key)?.value ?? null,
      put: async (
        key: string,
        value: string,
        opts?: { metadata?: unknown },
      ) => {
        store.set(key, { value, metadata: opts?.metadata ?? null });
      },
    } as unknown as KVNamespace,
  };
}

function fakeCtx() {
  const pending: Promise<unknown>[] = [];
  return {
    pending,
    ctx: {
      waitUntil: (p: Promise<unknown>) => pending.push(p),
    } as unknown as ExecutionContext,
  };
}

const key = "data:test" as CacheKey;
const opts = { key, staleAfter: 60, expirationTtl: 3600 };

describe("KVCache.cached", () => {
  test("computes and stores on a miss", async () => {
    const { kv, store } = fakeKv();
    const { ctx, pending } = fakeCtx();
    const cache = new KVCache(kv, ctx);

    expect(await cache.cached(async () => "fresh", opts)).toBe("fresh");
    await Promise.all(pending);
    expect(JSON.parse(store.get("test:data:test")!.value)).toBe("fresh");
  });

  test("serves a fresh hit without recomputing", async () => {
    const { kv, store } = fakeKv();
    store.set("test:data:test", {
      value: JSON.stringify("cached"),
      metadata: { storedAt: Date.now() },
    });
    const { ctx, pending } = fakeCtx();
    const fn = vi.fn(async () => "fresh");

    expect(await new KVCache(kv, ctx).cached(fn, opts)).toBe("cached");
    expect(fn).not.toHaveBeenCalled();
    expect(pending).toHaveLength(0);
  });

  test("serves a stale hit and refreshes it in the background", async () => {
    const { kv, store } = fakeKv();
    store.set("test:data:test", {
      value: JSON.stringify("old"),
      metadata: { storedAt: Date.now() - 61_000 },
    });
    const { ctx, pending } = fakeCtx();

    expect(await new KVCache(kv, ctx).cached(async () => "new", opts)).toBe(
      "old",
    );
    await Promise.all(pending);
    expect(JSON.parse(store.get("test:data:test")!.value)).toBe("new");
  });

  test("treats entries without metadata as stale", async () => {
    const { kv, store } = fakeKv();
    store.set("test:data:test", {
      value: JSON.stringify("legacy"),
      metadata: null,
    });
    const { ctx, pending } = fakeCtx();

    expect(await new KVCache(kv, ctx).cached(async () => "new", opts)).toBe(
      "legacy",
    );
    await Promise.all(pending);
    expect(JSON.parse(store.get("test:data:test")!.value)).toBe("new");
  });
});
