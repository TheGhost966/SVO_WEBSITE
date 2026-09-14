/**
 * Minimal in-memory per-key rate limiter for public form submissions.
 * Good enough for a single-instance deployment; resets on restart and
 * doesn't coordinate across instances behind a load balancer. If this
 * site ever runs multi-instance, swap the Map for Redis/Upstash — the
 * call site (`checkRateLimit`) doesn't need to change.
 */
const hits = new Map<string, number[]>()

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}
