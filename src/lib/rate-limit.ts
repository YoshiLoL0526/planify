/**
 * Rate limit en memoria (nodo único; docs/09 · 9.5).
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  /** Segundos recomendados para reintentar (0 si la petición está permitida). */
  retryAfterSeconds: number;
};

/**
 * Registra una petición para la clave dada.
 * Devuelve `allowed: false` cuando se supera el límite en la ventana, junto
 * con el `Retry-After` recomendado.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
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
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
