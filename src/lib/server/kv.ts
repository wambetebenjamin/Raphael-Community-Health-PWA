import "server-only";

const kvUrl = () => process.env.KV_REST_API_URL;
const kvToken = () => process.env.KV_REST_API_TOKEN;

export function kvConfigured() {
  return Boolean(kvUrl() && kvToken());
}

export async function kvCommand<T = unknown>(parts: Array<string | number>): Promise<T> {
  const url = kvUrl();
  const token = kvToken();
  if (!url || !token) throw new Error("County storage is not configured.");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parts),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("County storage is temporarily unavailable.");
  const result = await response.json() as { result?: T; error?: string };
  if (result.error) throw new Error("County storage is temporarily unavailable.");
  return result.result as T;
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const value = await kvCommand<string | null>(["GET", key]);
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export async function kvSetJson(key: string, value: unknown) {
  return kvCommand<string>(["SET", key, JSON.stringify(value)]);
}

export async function kvSetJsonIfMissing(key: string, value: unknown) {
  return kvCommand<string | null>(["SET", key, JSON.stringify(value), "NX"]);
}

export async function kvHashGetAll<T>(key: string): Promise<Record<string, T>> {
  const value = await kvCommand<unknown>(["HGETALL", key]);
  if (!value) return {};
  if (Array.isArray(value)) {
    const result: Record<string, T> = {};
    for (let index = 0; index + 1 < value.length; index += 2) {
      try { result[String(value[index])] = JSON.parse(String(value[index + 1])) as T; } catch { /* Skip corrupt entries. */ }
    }
    return result;
  }
  if (typeof value === "object") return value as Record<string, T>;
  return {};
}

export async function kvHashSet(key: string, field: string, value: unknown) {
  return kvCommand<number>(["HSET", key, field, JSON.stringify(value)]);
}

export async function kvHashDelete(key: string, field: string) {
  return kvCommand<number>(["HDEL", key, field]);
}

export async function kvSetAdd(key: string, value: string) {
  return kvCommand<number>(["SADD", key, value]);
}
