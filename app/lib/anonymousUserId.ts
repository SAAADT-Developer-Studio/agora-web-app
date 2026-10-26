/** Anonymous device id. Stored JSON-encoded so `useLocalStorage` can parse it. */
export const ANONYMOUS_USER_ID_KEY = "user_id";

/**
 * Stored values have been written both raw and with `JSON.stringify`, and a
 * second stringify wrapped an already-quoted id. Unwrap until the bare id
 * remains so PostHog and vote requests share one identity.
 */
export function unwrapStoredUserId(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 4; i++) {
    if (!value.startsWith('"')) break;
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "string") break;
      value = parsed.trim();
    } catch {
      break;
    }
  }
  return value;
}

export function readAnonymousUserId(
  storage: Pick<Storage, "getItem" | "setItem">,
  createId: () => string = () => crypto.randomUUID(),
): string {
  const raw = storage.getItem(ANONYMOUS_USER_ID_KEY);
  let id = raw ? unwrapStoredUserId(raw) : "";
  if (!id) id = createId();

  const canonical = JSON.stringify(id);
  if (raw !== canonical) storage.setItem(ANONYMOUS_USER_ID_KEY, canonical);
  return id;
}
