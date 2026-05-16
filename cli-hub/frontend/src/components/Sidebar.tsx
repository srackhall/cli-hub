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
  tools: ToolInfo[]
  selectedTool: string | null
  onSelectTool: (name: string) => void
  onRefreshTools: () => void
}

export function Sidebar({ tools, selectedTool, onSelectTool, onRefreshTools }: SidebarProps) {
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

  return (
    <div className="w-44 md:w-52 lg:w-60 border-r flex flex-col bg-muted/30 shrink-0">
      <div className="p-2 md:p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          <Input
            placeholder={t("sidebar.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 md:pl-8 h-7 md:h-8 text-xs md:text-sm"
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
            <Plus className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
            {importing ? "..." : t("sidebar.import")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 md:p-2 space-y-0.5 md:space-y-1">
          {filtered.map((tool) => {
            const desc = text(tool.description, tool.descriptionZh)
            return (
            <div
              key={tool.name}
              className={`group w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm transition-colors flex items-center gap-1.5 md:gap-2 cursor-pointer ${
                selectedTool === tool.name
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 text-foreground"
              }`}
              onClick={() => onSelectTool(tool.name)}
            >
              <Box className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-muted-foreground" />
              <div className="truncate flex-1 min-w-0">
                <div className="truncate text-xs md:text-sm font-medium">{tool.name}</div>
                {desc && (
                  <div className="truncate text-[10px] md:text-[11px] text-muted-foreground mt-0.5">
                    {desc}
                  </div>
                )}
              </div>
              {!tool.ready && (
                <Badge variant="destructive" className="ml-auto shrink-0 text-[9px] md:text-[10px] px-1 md:px-1.5 py-0">
                  {t("sidebar.errBadge")}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 md:h-6 md:w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(tool.name)
                }}
                title={t("sidebar.delete")}
              >
                <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )})}
          {filtered.length === 0 && (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">
              {tools.length === 0 ? t("sidebar.noTools") : t("sidebar.noMatches")}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
