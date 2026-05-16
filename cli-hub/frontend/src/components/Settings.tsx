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
    <div className="flex-1 overflow-auto p-6 min-w-0">
      <h2 className="text-sm font-semibold mb-6">{t("settings.title")}</h2>

      <div className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="cliPath" className="text-xs">{t("settings.cliPathLabel")}</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t("settings.cliPathDesc")}</p>
          <div className="flex gap-2">
            <Input
              id="cliPath"
              value={cliPath}
              onChange={(e) => setCliPath(e.target.value)}
              placeholder="/path/to/cli/tools"
              className="flex-1 h-8 text-xs font-mono"
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} title={t("settings.refresh")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
          <Save className="h-4 w-4 mr-1.5" />
          {saved ? t("settings.saved") : t("settings.save")}
        </Button>

        <div className="pt-5 border-t space-y-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{t("settings.cliDirHint")}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            {t("settings.dbDirHint")}
          </p>
        </div>
      </div>
    </div>
  )
}
