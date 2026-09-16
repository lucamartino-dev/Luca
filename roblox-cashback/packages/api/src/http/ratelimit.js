import { now } from '../util/clock.js';
import { tooManyRequests } from '../util/errors.js';

/** Finestra fissa in memoria: sufficiente per un singolo nodo, da sostituire con Redis in scale-out. */
export const createRateLimiter = ({ windowMs, max }) => {
  const buckets = new Map();
  return (key) => {
    const current = now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= current) {
      buckets.set(key, { count: 1, resetAt: current + windowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > max) {
      throw tooManyRequests('rate_limited', 'Troppe richieste, riprova tra poco');
    }
    if (buckets.size > 10_000) {
      for (const [entryKey, entry] of buckets) if (entry.resetAt <= current) buckets.delete(entryKey);
    }
  };
};
