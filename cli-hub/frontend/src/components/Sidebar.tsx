import type { ToolInfo } from "@/types"

interface SidebarProps {
  tools: ToolInfo[]
  selectedTool: string | null
  onSelectTool: (name: string) => void
}

export function Sidebar({ tools, selectedTool, onSelectTool }: SidebarProps) {
  return <div className="w-56 border-r bg-muted/30 p-4">Sidebar ({tools.length} tools)</div>
}
