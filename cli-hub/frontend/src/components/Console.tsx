import type { LogEntry } from "@/types"

interface ConsoleProps {
  logs: LogEntry[]
}

export function Console({ logs }: ConsoleProps) {
  return (
    <div className="h-40 border-t overflow-auto bg-black text-green-400 font-mono text-xs p-3">
      {logs.length === 0 ? (
        <p className="text-green-700">Ready. Select a tool and click Execute to begin.</p>
      ) : (
        logs.map((entry, i) => (
          <div key={i} className={entry.stream === "stderr" ? "text-red-400" : "text-green-400"}>
            [{new Date(entry.ts).toLocaleTimeString()}] {entry.text}
          </div>
        ))
      )}
    </div>
  )
}
