const IDEMPOTENCY_KEY = "cognicart_idempotency"

type Entry = { key: string; response: unknown; createdAt: number }

function getStore(): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(IDEMPOTENCY_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, Entry>) {
  // prune older than 24h and keep max 500
  const now = Date.now()
  for (const k of Object.keys(store)) {
    if (now - store[k].createdAt > 86400000) delete store[k]
  }
  const keys = Object.keys(store)
  if (keys.length > 500) {
    keys.sort((a, b) => store[a].createdAt - store[b].createdAt)
    for (let i = 0; i < keys.length - 500; i++) delete store[keys[i]]
  }
  localStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify(store))
}

export function getIdempotencyKey(payload: unknown): string {
  // deterministic key from payload JSON
  const str = JSON.stringify(payload)
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return `idem_${hash.toString(36)}_${str.length}`
}

export function getIdempotentResponse<T>(key: string): T | null {
  const store = getStore()
  const entry = store[key]
  if (entry && Date.now() - entry.createdAt < 86400000) return entry.response as T
  return null
}

export function setIdempotentResponse(key: string, response: unknown) {
  const store = getStore()
  store[key] = { key, response, createdAt: Date.now() }
  saveStore(store)
}
