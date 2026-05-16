import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { LogEntry } from "@/types"

interface ConsoleProps {
  logs: LogEntry[]
  height: number
}

export function Console({ logs, height }: ConsoleProps) {
  const { t } = useTranslation()
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
      style={{ height, backgroundColor: "#090E15", color: "#A7F3D0" }}
    >
      {logs.length === 0 && (
        <p className="text-green-900/60">{t("console.ready")}</p>
      )}
      {logs.map((entry, i) => (
        <div
          key={i}
          className={
            entry.stream === "stderr"
              ? "text-red-400"
              : "text-green-300/90"
          }
        >
          <span className="text-green-900/50 select-none">
            [{new Date(entry.ts).toLocaleTimeString()}]
          </span>{" "}
          {entry.text}
        </div>
      ))}
    </div>
  )
}
