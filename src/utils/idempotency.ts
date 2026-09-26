const generated = new Set<string>()

/**
 * Generates a request-scoped idempotency key without persisting any browser data.
 * The backend remains the authority for deduplication.
 */
export function getIdempotencyKey(scope: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  const key = `${scope}_${random}`
  generated.add(key)
  return key
}

export function clearIdempotencyKeys() {
  generated.clear()
}
