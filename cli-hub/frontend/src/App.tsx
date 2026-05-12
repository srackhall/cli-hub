import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import type { ToolInfo, LogEntry } from "@/types"

export default function App() {
  const [tools, _setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

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
          onLog={(entry) => setLogs((prev) => [...prev, entry])}
        />
      </div>
      <Console logs={logs} />
      <StatusBar toolCount={tools.length} readyCount={tools.filter((t) => t.ready).length} />
    </div>
  )
}
