import { CheckCircle2, AlertCircle } from "lucide-react"

interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  const allReady = toolCount > 0 && readyCount === toolCount

  return (
    <div className="h-7 border-t flex items-center justify-between px-4 text-xs text-muted-foreground bg-muted/30">
      <span>
        tools/ ({toolCount} tool{toolCount !== 1 ? "s" : ""})
      </span>
      {toolCount > 0 && (
        <span className="flex items-center gap-1">
          {allReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-600">All Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-600">
                {readyCount}/{toolCount} Ready
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
