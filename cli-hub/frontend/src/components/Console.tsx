import { useEffect, useRef } from "react"
import type { LogEntry } from "@/types"

interface ConsoleProps {
  logs: LogEntry[]
}

export function Console({ logs }: ConsoleProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [logs])

  return (
    <div ref={ref} className="h-40 border-t overflow-auto bg-black text-green-400 font-mono text-xs p-3">
      {logs.length === 0 && (
        <p className="text-green-700">Ready. Select a tool and click Execute to begin.</p>
      )}
      {logs.map((entry, i) => (
        <div key={i} className={entry.stream === "stderr" ? "text-red-400" : "text-green-400"}>
          <span className="text-green-700">
            [{new Date(entry.ts).toLocaleTimeString()}]
          </span>{" "}
          {entry.text}
        </div>
      ))}
    </div>
  )
}
