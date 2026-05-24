import { CheckCircle2, AlertCircle, Folder } from "lucide-react"

interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  const allReady = toolCount > 0 && readyCount === toolCount

  return (
    <div className="h-7 border-t flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0 select-none">
      <span className="flex items-center gap-1.5">
        <Folder className="h-3 w-3" />
        <span>cli/</span>
        <span className="text-muted-foreground/50">
          {toolCount} 个工具
        </span>
      </span>
      {toolCount > 0 && (
        <span className="flex items-center gap-1.5">
          {allReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-accent" />
              <span className="text-accent font-medium">全部就绪</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-500 font-medium">
                {readyCount}/{toolCount} 就绪
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
