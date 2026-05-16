import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, FolderOpen, RefreshCw } from "lucide-react"
import * as WailsApp from "@bindings/changeme/app"

interface SettingsProps {
  onRefreshTools: () => void
}

export function Settings({ onRefreshTools }: SettingsProps) {
  const { t } = useTranslation()
  const [cliPath, setCliPath] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    WailsApp.GetSettings().then((s) => {
      if (s) setCliPath(s.cliPath ?? "")
    })
  }, [])

  const handleSave = async () => {
    await WailsApp.UpdateSettings({ cliPath })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRefresh = async () => {
    await WailsApp.RefreshTools()
    onRefreshTools()
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 min-w-0">
      <h2 className="text-base md:text-lg font-semibold mb-4">{t("settings.title")}</h2>

      <div className="space-y-5 md:space-y-6 max-w-lg">
        {/* CLI Path */}
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="cliPath">{t("settings.cliPathLabel")}</Label>
          <p className="text-[11px] md:text-xs text-muted-foreground">{t("settings.cliPathDesc")}</p>
          <div className="flex gap-1.5 md:gap-2">
            <Input
              id="cliPath"
              value={cliPath}
              onChange={(e) => setCliPath(e.target.value)}
              placeholder="/path/to/cli/tools"
              className="flex-1 text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleRefresh} title={t("settings.refresh")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} size="sm">
          <Save className="h-4 w-4 mr-1" />
          {saved ? t("settings.saved") : t("settings.save")}
        </Button>

        {/* Info */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <FolderOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{t("settings.cliDirHint")}</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            {t("settings.dbDirHint")}
          </p>
        </div>
      </div>
    </div>
  )
}
