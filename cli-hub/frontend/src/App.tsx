import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Events } from "@wailsio/runtime"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Settings } from "@/components/Settings"
import { Button } from "@/components/ui/button"
import { Wrench, SettingsIcon } from "lucide-react"
import { useResizable } from "@/hooks/useResizable"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolInfo, LogEntry } from "@/types"
import "@/i18n"

type Page = "tools" | "settings"

const MIN_SIDEBAR = 140
const MAX_SIDEBAR = 420
const MIN_CONSOLE = 80

export default function App() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page>("tools")
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const sidebar = useResizable({ defaultSize: 200, minSize: MIN_SIDEBAR, maxSize: MAX_SIDEBAR, axis: "x" })
  const consolePanel = useResizable({ defaultSize: 150, minSize: MIN_CONSOLE, maxSize: 500, axis: "y" })

  const loadTools = useCallback(() => {
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

  useEffect(() => { loadTools() }, [loadTools])

  useEffect(() => {
    const unsub = Events.On("tool-output", (ev: { name: string; data: { stream: string; text: string } }) => {
      const { stream, text } = ev.data
      setLogs((prev) => [...prev, { stream: stream as "stdout" | "stderr", text, ts: Date.now() }])
    })
    return () => unsub()
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="h-9 border-b flex items-center justify-between px-3 shrink-0" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
        <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <Button
            variant={page === "tools" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("tools")}
            className="h-7 text-xs px-2.5 rounded-md"
          >
            <Wrench className="h-3.5 w-3.5 mr-1" />
            {t("nav.tools")}
          </Button>
          <Button
            variant={page === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("settings")}
            className="h-7 text-xs px-2.5 rounded-md"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            {t("nav.settings")}
          </Button>
        </div>
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main content */}
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
              onLog={(entry) => setLogs((prev) => [...prev, entry as LogEntry])}
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

      {/* Drag overlay for smooth mouse tracking */}
      {(sidebar.dragging || consolePanel.dragging) && (
        <div className={`drag-overlay${consolePanel.dragging ? " drag-overlay-y" : ""}`} />
      )}
    </div>
  )
}
