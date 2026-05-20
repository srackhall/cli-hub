type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  ts: number
  level: LogLevel
  msg: string
}

const STORAGE_KEY = "cli-hub-logs"
const MAX_ENTRIES = 300
const API_BASE = "http://127.0.0.1:9246"

function loadEntries(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEntries(entries: LogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    const half = entries.slice(-150)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(half)) } catch { /* full */ }
  }
}

let queue: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushToBackend() {
  if (queue.length === 0) return
  const batch = queue
  queue = []
  fetch(`${API_BASE}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batch),
    keepalive: true,
  }).catch(() => {})
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushToBackend()
  }, 2000)
}

function log(level: LogLevel, msg: string) {
  const entry: LogEntry = { ts: Date.now(), level, msg }

  // Always write to console so DevTools sees it immediately
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  fn(`[${level.toUpperCase()}] ${msg}`)

  // Always persist to localStorage (full history, all levels)
  const entries = loadEntries()
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES)
  }
  saveEntries(entries)

  // Queue for backend flush (Go side filters by minLevel)
  queue.push(entry)
  scheduleFlush()
}

// Flush on unload via sendBeacon for reliability
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (queue.length === 0) return
    const blob = new Blob([JSON.stringify(queue)], { type: "application/json" })
    navigator.sendBeacon(`${API_BASE}/api/logs`, blob)
    queue = []
  })
}

export const logger = {
  debug: (msg: string) => log("debug", msg),
  info:  (msg: string) => log("info", msg),
  warn:  (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),

  dump: (): string => {
    const entries = loadEntries()
    return entries
      .map((e) => `${new Date(e.ts).toISOString()} [${e.level.toUpperCase().padEnd(5)}] ${e.msg}`)
      .join("\n")
  },

  getEntries: (): LogEntry[] => loadEntries(),
  flush: () => flushToBackend(),
}

// Expose globally for console access
;(window as any).__logger = logger

// From this point forward, __log routes directly to the real logger
;(window as any).__log = (level: LogLevel, msg: string) => logger[level](msg)

// Drain any early logs buffered by index.html monkey-patch (pre-logger-load)
const earlyLogs = (window as any).__earlyLogs as LogEntry[] | undefined
if (earlyLogs && Array.isArray(earlyLogs) && earlyLogs.length > 0) {
  logger.info(`logger: draining ${earlyLogs.length} early log entries`)
  for (const e of earlyLogs) {
    log(e.level, e.msg)
  }
}
delete (window as any).__earlyLogs

logger.info('logger: module loaded')
