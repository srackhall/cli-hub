import { useState, useEffect } from "react"
import { Events } from "@wailsio/runtime"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolInfo, LogEntry } from "@/types"

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    async function load() {
      try {
        const list = await WailsApp.ListTools()
        setTools(list ?? [])
        if (list && list.length > 0) {
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
    const unsub = Events.On("tool-output", (ev: { name: string; data: { stream: string; text: string } }) => {
      const { stream, text } = ev.data
      setLogs((prev) => [
        ...prev,
        { stream: stream as "stdout" | "stderr", text, ts: Date.now() },
      ])
    })
    return () => unsub()
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
