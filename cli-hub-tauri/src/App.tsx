import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import { Settings } from "@/components/Settings"
import { Button } from "@/components/ui/button"
import { Wrench, SettingsIcon, Sun, Moon } from "lucide-react"
import { useResizable } from "@/hooks/useResizable"
import { useTheme } from "@/hooks/useTheme"
import { api, type ToolInfo, type LogEntry } from "@/api"
import { listen } from "@tauri-apps/api/event"

type Page = "tools" | "settings"

const MIN_SIDEBAR = 160
const MAX_SIDEBAR = 420
const MIN_CONSOLE = 80

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [page, setPage] = useState<Page>("tools")
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const sidebar = useResizable({ defaultSize: 220, minSize: MIN_SIDEBAR, maxSize: MAX_SIDEBAR, axis: "x" })
  const consolePanel = useResizable({ defaultSize: 160, minSize: MIN_CONSOLE, maxSize: 500, axis: "y" })

  const loadTools = useCallback(async () => {
    try {
      const list = await api.listTools()
      if (list && Array.isArray(list)) {
        setTools(list)
        setSelectedTool((prev) => {
          if (list.length > 0 && !prev) return list[0].name
          if (prev && !list.find((t) => t.name === prev)) return list.length > 0 ? list[0].name : null
          return prev
        })
      } else {
        setTools([])
      }
    } catch (e) {
      console.error("加载工具失败:", e)
      setTools([])
    }
  }, [])

  useEffect(() => { loadTools() }, [loadTools])

  // Listen for tool output events
  useEffect(() => {
    const unlisten = listen<{ stream: string; text: string }>("tool-output", (event) => {
      setLogs((prev) => [
        ...prev,
        {
          stream: event.payload.stream as "stdout" | "stderr",
          text: event.payload.text,
          ts: Date.now(),
        },
      ])
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div
        className="h-10 border-b flex items-center justify-between px-4 shrink-0"
        style={{ background: "var(--topbar-bg)", backdropFilter: "blur(20px) saturate(180%)" } as React.CSSProperties}
      >
        <div className="flex items-center gap-1">
          <Button
            variant={page === "tools" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("tools")}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium tracking-tight"
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            工具
          </Button>
          <Button
            variant={page === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("settings")}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
            设置
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleTheme}
            title={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {page === "tools" ? (
        <>
          <div className="flex flex-1 overflow-hidden min-h-0">
            <Sidebar
              width={sidebar.size}
              tools={tools}
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              onRefreshTools={loadTools}
            />
            <div
              className={`resize-handle-x${sidebar.dragging ? " dragging" : ""}`}
              onMouseDown={sidebar.onMouseDown}
            />
            <MainPanel
              selectedTool={selectedTool}
              onLog={(entry: LogEntry) => setLogs((prev) => [...prev, entry])}
            />
          </div>
          <div
            className={`resize-handle-y${consolePanel.dragging ? " dragging" : ""}`}
            onMouseDown={consolePanel.onMouseDown}
          />
          <Console logs={logs} height={consolePanel.size} />
          <StatusBar toolCount={tools.length} readyCount={tools.filter((t) => t.ready).length} />
        </>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <Settings onRefreshTools={loadTools} />
        </div>
      )}

      {(sidebar.dragging || consolePanel.dragging) && (
        <div className={`drag-overlay${consolePanel.dragging ? " drag-overlay-y" : ""}`} />
      )}
    </div>
  )
}
