import { useEffect, useRef } from "react"
import type { LogEntry } from "@/types"

interface ConsoleProps {
  logs: LogEntry[]
  height: number
}

export function Console({ logs, height }: ConsoleProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [logs])

  return (
    <div
      ref={ref}
      className="border-t overflow-auto shrink-0 font-mono text-[11px] leading-relaxed p-3"
      style={{ height, background: "var(--console-bg)", color: "var(--console-text)" }}
    >
      {logs.length === 0 && (
        <p className="opacity-30">就绪。选择一个工具并点击执行开始。</p>
      )}
      {logs.map((entry, i) => (
        <div
          key={i}
          className={
            entry.stream === "stderr"
              ? "text-red-500/90"
              : "opacity-85"
          }
        >
          <span className="opacity-20 select-none">
            [{new Date(entry.ts).toLocaleTimeString()}]
          </span>{" "}
          {entry.text}
        </div>
      ))}
    </div>
  )
}
