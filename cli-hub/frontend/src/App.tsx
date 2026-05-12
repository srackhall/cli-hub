import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import type { ToolInfo, LogEntry } from "@/types"

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    async function load() {
      try {
        // @ts-expect-error - Wails runtime injected at build time
        const list = await window.go.main.App.ListTools()
        setTools(list)
        if (list.length > 0) {
          setSelectedTool(list[0].name)
        }
      } catch (e) {
        console.error("Failed to load tools:", e)
      }
    }
    load()
  }, [])

  // Listen for real-time tool output events
  useEffect(() => {
    try {
      // @ts-expect-error - Wails runtime
      window.go.main.App.OnToolOutput((data: { stream: string; text: string }) => {
        setLogs((prev) => [
          ...prev,
          { stream: data.stream, text: data.text, ts: Date.now() } as LogEntry,
        ])
      })
    } catch (e) {
      // Event listener not available in dev without Wails runtime
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tools={tools}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
        <MainPanel
          selectedTool={selectedTool}
          onLog={(entry) => setLogs((prev) => [...prev, entry as LogEntry])}
        />
      </div>
      <Console logs={logs} />
      <StatusBar toolCount={tools.length} readyCount={tools.filter((t) => t.ready).length} />
    </div>
  )
}
