import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Box } from "lucide-react"
import type { ToolInfo } from "@/types"

interface SidebarProps {
  tools: ToolInfo[]
  selectedTool: string | null
  onSelectTool: (name: string) => void
}

export function Sidebar({ tools, selectedTool, onSelectTool }: SidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-56 border-r flex flex-col bg-muted/30">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map((tool) => (
            <button
              key={tool.name}
              onClick={() => onSelectTool(tool.name)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                selectedTool === tool.name
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 text-foreground"
              }`}
            >
              <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{tool.name}</span>
              {!tool.ready && (
                <Badge variant="destructive" className="ml-auto shrink-0 text-[10px] px-1.5 py-0">
                  Err
                </Badge>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tools.length === 0 ? "No tools found" : "No matches"}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
