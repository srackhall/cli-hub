import type { LogEntry } from "@/types"

interface MainPanelProps {
  selectedTool: string | null
  onLog: (entry: LogEntry) => void
}

export function MainPanel({ selectedTool, onLog }: MainPanelProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      {selectedTool ? <p>Selected: {selectedTool}</p> : <p>Select a tool from the sidebar to get started.</p>}
    </div>
  )
}
