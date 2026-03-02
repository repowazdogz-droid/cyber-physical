export type CacheHit<T> = { ok: true; value: T } | { ok: false };

type Entry<T> = { key: string; value: T; at: number };

const QUERY_CACHE = new Map<string, Entry<any>>();
const QUERY_CACHE_MAX = 256;

export function cacheGet<T>(key: string): CacheHit<T> {
  const e = QUERY_CACHE.get(key);
  if (!e) return { ok: false };
  e.at = Date.now();
  return { ok: true, value: e.value as T };
}

export function cacheSet<T>(key: string, value: T) {
  QUERY_CACHE.set(key, { key, value, at: Date.now() });

  if (QUERY_CACHE.size > QUERY_CACHE_MAX) {
    // evict oldest ~20%
    const entries = [...QUERY_CACHE.values()].sort((a, b) => a.at - b.at);
    const drop = Math.floor(entries.length * 0.2);
    for (let i = 0; i < drop; i++) QUERY_CACHE.delete(entries[i]!.key);
  }
}

export function clearQueryCache() {
  QUERY_CACHE.clear();
}

























