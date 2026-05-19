import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Settings } from "@/components/Settings"
import { Button } from "@/components/ui/button"
import { Wrench, SettingsIcon, Sun, Moon } from "lucide-react"
import { useResizable } from "@/hooks/useResizable"
import { useTheme } from "@/hooks/useTheme"
import { api, type ToolInfo, type LogEntry } from "@/api"
import "@/i18n"

type Page = "tools" | "settings"

const MIN_SIDEBAR = 160
const MAX_SIDEBAR = 420
const MIN_CONSOLE = 80

export default function App() {
  const { t } = useTranslation()
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
      console.log("[loadTools] got", list, "isArray:", Array.isArray(list), "length:", list?.length)
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
      console.error("[loadTools] failed:", e)
      setTools([])
    }
  }, [])

  useEffect(() => { loadTools() }, [loadTools])

  useEffect(() => {
    const prevent = (e: Event) => {
      const de = e as DragEvent
      if (de.dataTransfer?.types?.includes("Files")) {
        e.preventDefault()
      }
    }
    document.addEventListener("dragover", prevent)
    document.addEventListener("drop", prevent)
    return () => {
      document.removeEventListener("dragover", prevent)
      document.removeEventListener("drop", prevent)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar — macOS titlebar region */}
      <div
        className="h-10 border-b flex items-center justify-between px-4 shrink-0"
        style={{ WebkitAppRegion: "drag", background: "var(--topbar-bg)", backdropFilter: "blur(20px) saturate(180%)" } as React.CSSProperties}
      >
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <Button
            variant={page === "tools" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("tools")}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium tracking-tight"
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tools")}
          </Button>
          <Button
            variant={page === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("settings")}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.settings")}
          </Button>
        </div>
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties} className="flex items-center gap-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleTheme}
            title={theme === "dark" ? t("theme.light") : t("theme.dark")}
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
