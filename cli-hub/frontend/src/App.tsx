import { useState, useEffect } from "react"
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
import * as WailsApp from "@bindings/changeme/app"
import type { ToolInfo, LogEntry } from "@/types"
import "@/i18n"

const IS_MOCK = typeof window !== "undefined" && !("go" in window)

type Page = "tools" | "settings"

export default function App() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page>("tools")
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const loadTools = () => {
    if (IS_MOCK) {
      import("@/mock").then(({ MOCK_TOOLS }) => {
        setTools(MOCK_TOOLS)
        if (!selectedTool || !MOCK_TOOLS.find((t: ToolInfo) => t.name === selectedTool)) {
          setSelectedTool(MOCK_TOOLS[0]?.name ?? null)
        }
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
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTools() }, [])

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

  const handleRefreshTools = () => {
    loadTools()
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="h-9 border-b flex items-center justify-between px-3 bg-muted/20">
        <div className="flex items-center gap-1">
          <Button
            variant={page === "tools" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("tools")}
            className="h-7 text-xs"
          >
            <Wrench className="h-3.5 w-3.5 mr-1" />
            {t("nav.tools")}
          </Button>
          <Button
            variant={page === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPage("settings")}
            className="h-7 text-xs"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            {t("nav.settings")}
          </Button>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      {page === "tools" ? (
        <>
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
        </>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Settings onRefreshTools={handleRefreshTools} />
        </div>
      )}
    </div>
  )
}
