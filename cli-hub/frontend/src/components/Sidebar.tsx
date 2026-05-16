import { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, Box, Plus, Trash2 } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolInfo } from "@/types"

interface SidebarProps {
  width: number
  tools: ToolInfo[]
  selectedTool: string | null
  onSelectTool: (name: string) => void
  onRefreshTools: () => void
}

export function Sidebar({ width, tools, selectedTool, onSelectTool, onRefreshTools }: SidebarProps) {
  const { t } = useTranslation()
  const { text } = useLocale()
  const [search, setSearch] = useState("")
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      await WailsApp.ImportTool((file as any).path ?? file.name)
      onRefreshTools()
    } catch (err) {
      console.error("Import failed:", err)
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = async (name: string) => {
    if (!window.confirm(t("sidebar.deleteConfirm", { name }))) return
    try {
      await WailsApp.DeleteTool(name)
      onRefreshTools()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const compact = width < 180

  return (
    <div className="border-r flex flex-col shrink-0" style={{ width }}>
      <div className="p-2 border-b space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={compact ? t("sidebar.search") : t("sidebar.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Plus className="h-3 w-3 mr-1" />
            {importing ? "..." : compact ? "" : t("sidebar.import")}
          </Button>
          <input ref={fileInputRef} type="file" onChange={handleImport} className="hidden" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {filtered.map((tool) => {
            const desc = text(tool.description, tool.descriptionZh)
            return (
            <div
              key={tool.name}
              className={`group w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedTool === tool.name
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 text-foreground"
              }`}
              onClick={() => onSelectTool(tool.name)}
            >
              <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="truncate flex-1 min-w-0">
                <div className="truncate text-xs font-medium">{tool.name}</div>
                {desc && !compact && (
                  <div className="truncate text-[10px] text-muted-foreground mt-0.5">
                    {desc}
                  </div>
                )}
              </div>
              {!tool.ready && (
                <Badge variant="destructive" className="ml-auto shrink-0 text-[9px] px-1 py-0">
                  {t("sidebar.errBadge")}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(tool.name)
                }}
                title={t("sidebar.delete")}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )})}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              {tools.length === 0 ? t("sidebar.noTools") : t("sidebar.noMatches")}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
