import { invoke } from "@tauri-apps/api/core";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
}

let queue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushToBackend() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  invoke("log_frontend", { entries: batch }).catch(() => {});
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushToBackend();
  }, 2000);
}

function log(level: LogLevel, msg: string) {
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  fn(`[${level.toUpperCase()}] ${msg}`);

  queue.push({ level, msg });
  scheduleFlush();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (queue.length === 0) return;
    invoke("log_frontend", { entries: [...queue] }).catch(() => {});
    queue = [];
  });
}

export const logger = {
  debug: (msg: string) => log("debug", msg),
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),
};
