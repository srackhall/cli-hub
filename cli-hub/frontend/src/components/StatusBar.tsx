import { useTranslation } from "react-i18next"
import { CheckCircle2, AlertCircle, Folder } from "lucide-react"

interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  const { t } = useTranslation()
  const allReady = toolCount > 0 && readyCount === toolCount

  return (
    <div className="h-7 border-t flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0 select-none">
      <span className="flex items-center gap-1.5">
        <Folder className="h-3 w-3" />
        <span>{t("statusBar.toolsDir")}</span>
        <span className="text-muted-foreground/50">
          {t("statusBar.toolCount", { count: toolCount })}
        </span>
      </span>
      {toolCount > 0 && (
        <span className="flex items-center gap-1.5">
          {allReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">{t("statusBar.allReady")}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-500 font-medium">
                {t("statusBar.readyCount", { ready: readyCount, total: toolCount })}
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
