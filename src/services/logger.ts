type Level = "info" | "warn" | "error" | "debug"

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }
  // Structured: console as JSON for monitoring; in prod would ship to Sentry/Logtail
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.log
  fn(JSON.stringify(entry))
  // Persist last 200 entries for Reports debugging
  try {
    const key = "cognicart_logs"
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(entry)
    if (arr.length > 200) arr.shift()
    localStorage.setItem(key, JSON.stringify(arr))
  } catch {}
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  getRecent: (): Array<Record<string, unknown>> => {
    try {
      return JSON.parse(localStorage.getItem("cognicart_logs") || "[]")
    } catch {
      return []
    }
  },
}
