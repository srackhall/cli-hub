interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  return (
    <div className="h-7 border-t flex items-center px-4 text-xs text-muted-foreground bg-muted/30">
      tools/ ({toolCount} tool{toolCount !== 1 ? "s" : ""}) | {readyCount} ready
    </div>
  )
}
