import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_USER_ID_KEY,
  readAnonymousUserId,
  unwrapStoredUserId,
} from "~/lib/anonymousUserId";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    data,
  };
}

describe("anonymous user id", () => {
  it("unwraps a JSON string and a second layer of quotes", () => {
    expect(unwrapStoredUserId(JSON.stringify(UUID))).toBe(UUID);
    expect(unwrapStoredUserId(JSON.stringify(JSON.stringify(UUID)))).toBe(UUID);
    expect(unwrapStoredUserId(UUID)).toBe(UUID);
  });

  it("reads and writes one JSON string, and migrates quoted or raw values", () => {
    const quoted = memoryStorage({
      [ANONYMOUS_USER_ID_KEY]: JSON.stringify(JSON.stringify(UUID)),
    });
    expect(readAnonymousUserId(quoted)).toBe(UUID);
    expect(quoted.data[ANONYMOUS_USER_ID_KEY]).toBe(JSON.stringify(UUID));
    expect(JSON.parse(quoted.data[ANONYMOUS_USER_ID_KEY])).toBe(UUID);

    const raw = memoryStorage({ [ANONYMOUS_USER_ID_KEY]: UUID });
    expect(readAnonymousUserId(raw)).toBe(UUID);
    expect(raw.data[ANONYMOUS_USER_ID_KEY]).toBe(JSON.stringify(UUID));

    const canonical = memoryStorage({
      [ANONYMOUS_USER_ID_KEY]: JSON.stringify(UUID),
    });
    expect(readAnonymousUserId(canonical)).toBe(UUID);
    expect(canonical.data[ANONYMOUS_USER_ID_KEY]).toBe(JSON.stringify(UUID));
  });

  it("creates an id once and does not add quote characters to the identity", () => {
    const storage = memoryStorage();
    const created = readAnonymousUserId(storage, () => UUID);
    expect(created).toBe(UUID);
    expect(created.includes('"')).toBe(false);
    expect(readAnonymousUserId(storage, () => "other")).toBe(UUID);
  });
});
