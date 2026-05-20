type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  ts: number
  level: LogLevel
  msg: string
}

const STORAGE_KEY = "cli-hub-logs"
const MAX_ENTRIES = 300
const API_BASE = "http://127.0.0.1:9246"

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const minLevel: LogLevel = import.meta.env.PROD ? "info" : "debug"

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel]
}

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
    // localStorage full or unavailable — trim aggressively
    const half = entries.slice(-150)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half))
    } catch { /* silenced */ }
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
  }).catch(() => {
    // backend unreachable — entries already saved in localStorage
  })
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushToBackend()
  }, 2000)
}

function log(level: LogLevel, msg: string) {
  if (!shouldLog(level)) return

  const entry: LogEntry = { ts: Date.now(), level, msg }

  const entries = loadEntries()
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES)
  }
  saveEntries(entries)

  queue.push(entry)
  scheduleFlush()
}

// Also flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => flushToBackend())
}

export const logger = {
  debug: (msg: string) => log("debug", msg),
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),

  /** Dump all localStorage entries as a string (for user to copy/paste) */
  dump: (): string => {
    const entries = loadEntries()
    return entries
      .map((e) => `${new Date(e.ts).toISOString()} [${e.level.toUpperCase()}] ${e.msg}`)
      .join("\n")
  },

  /** Return raw entries for programmatic access */
  getEntries: (): LogEntry[] => loadEntries(),

  /** Flush pending entries to backend immediately */
  flush: () => flushToBackend(),
}

// Expose for console access in debug builds
if (import.meta.env.DEV) {
  ;(window as any).__logger = logger
}

// Drain early logs captured by index.html monkey-patch before React mount
const earlyLogs = (window as any).__earlyLogs as LogEntry[] | undefined
if (earlyLogs && Array.isArray(earlyLogs)) {
  for (const e of earlyLogs) {
    log(e.level, e.msg)
  }
  ;(window as any).__earlyLogs = undefined
}
