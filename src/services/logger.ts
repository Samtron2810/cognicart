type Level = "info" | "warn" | "error" | "debug"

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, message, ...meta }
  const write = level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.log
  write(JSON.stringify(entry))
}

/** Browser diagnostics are intentionally not persisted. Production telemetry belongs on the backend or monitoring service. */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  getRecent: (): Array<Record<string, unknown>> => [],
}
