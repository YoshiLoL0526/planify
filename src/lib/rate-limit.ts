/**
 * Rate limit en memoria (nodo único; docs/09 · 9.5).
 * `true` si la petición está permitida, `false` si supera el límite.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  let timestamps = buckets.get(key);
  if (!timestamps) {
    if (buckets.size >= MAX_KEYS) {
      buckets.clear();
    }
    timestamps = [];
    buckets.set(key, timestamps);
  }

  const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);
  return true;
}
