import { useState, useEffect } from "react"
import { Events } from "@wailsio/runtime"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolInfo, LogEntry } from "@/types"

const IS_MOCK = typeof window !== "undefined" && !("go" in window)

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    if (IS_MOCK) {
      import("@/mock").then(({ MOCK_TOOLS }) => {
        setTools(MOCK_TOOLS)
        setSelectedTool(MOCK_TOOLS[0].name)
      })
      return
    }
    let cancelled = false
    async function load() {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const list = await WailsApp.ListTools()
          if (!cancelled && list) {
            setTools(list)
            if (list.length > 0 && !selectedTool) {
              setSelectedTool(list[0].name)
            }
            return
          }
        } catch (e) {
          console.error(`ListTools attempt ${attempt + 1} failed:`, e)
        }
        await new Promise((r) => setTimeout(r, 500))
      }
    }
    load()
    return () => { cancelled = true }
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
