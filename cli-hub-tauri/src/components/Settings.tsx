import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, FolderOpen, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@/api"

interface SettingsProps {
  onRefreshTools: () => void
}

export function Settings({ onRefreshTools }: SettingsProps) {
  const { t, i18n } = useTranslation()
  const [cliPath, setCliPath] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s) setCliPath(s.cli_path ?? "")
    })
  }, [])

  const handleSave = async () => {
    await api.updateSettings({ cli_path: cliPath })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRefresh = async () => {
    await api.refreshTools()
    onRefreshTools()
  }

  return (
    <div className="flex-1 overflow-auto p-6 min-w-0">
      <h2 className="text-sm font-semibold mb-6">{t("settings.title")}</h2>

      <div className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="cliPath" className="text-xs">{t("settings.cliPath")}</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t("settings.cliPathDesc")}</p>
          <div className="flex gap-2">
            <Input
              id="cliPath"
              value={cliPath}
              onChange={(e) => setCliPath(e.target.value)}
              placeholder="/path/to/cli/tools"
              className="flex-1 h-8 text-xs font-mono"
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} title={t("settings.refreshTooltip")}>
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
            <span className="text-muted-foreground">{t("settings.cliDirNote")}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            {t("settings.dataNote")}
          </p>
        </div>

        <div className="pt-5 border-t space-y-2.5">
          <div>
            <Label className="text-xs">{t("settings.language")}</Label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{t("settings.languageDesc")}</p>
          </div>
          <Select
            value={i18n.language.startsWith("zh") ? "zh" : "en"}
            onValueChange={(v) => i18n.changeLanguage(v)}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
