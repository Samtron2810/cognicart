type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }
  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

export function rateLimited(key: string, limit: number, windowMs: number) {
  const r = checkRateLimit(key, limit, windowMs)
  if (!r.allowed) {
    const secs = Math.ceil((r.resetAt - Date.now()) / 1000)
    throw new Error(`Rate limit exceeded. Try again in ${secs}s`)
  }
}

export function clearRateLimit(key: string) {
  buckets.delete(key)
}
