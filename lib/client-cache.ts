const CACHE_TTL_MS = 30 * 1000;

interface CacheEnvelope<T> {
  createdAt: number;
  data: T;
}

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed.createdAt || !("data" in parsed)) return null;
    if (Date.now() - parsed.createdAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  const envelope: CacheEnvelope<T> = { createdAt: Date.now(), data };
  localStorage.setItem(key, JSON.stringify(envelope));
}
