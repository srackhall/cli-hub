import { useTranslation } from "react-i18next"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  const { t } = useTranslation()
  const allReady = toolCount > 0 && readyCount === toolCount

  return (
    <div className="h-7 border-t flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0">
      <span>
        {t("statusBar.toolsDir")} ({t("statusBar.toolCount", { count: toolCount })})
      </span>
      {toolCount > 0 && (
        <span className="flex items-center gap-1">
          {allReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{t("statusBar.allReady")}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-500">
                {t("statusBar.readyCount", { ready: readyCount, total: toolCount })}
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
