import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderOpen, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@/api"

interface SettingsProps {
  onRefreshTools: () => void
}

export function Settings({ onRefreshTools }: SettingsProps) {
  const { t, i18n } = useTranslation()
  const [cliDir, setCliDir] = useState("")
  const [dataDir, setDataDir] = useState("")

  useEffect(() => {
    api.getToolsDir().then(setCliDir)
    api.getDataDir().then(setDataDir)
  }, [])

  const handleOpenCliDir = async () => {
    await api.openToolsDir()
  }

  const handleOpenDataDir = async () => {
    await api.openDataDir()
  }

  const handleRefresh = async () => {
    await api.refreshTools()
    onRefreshTools()
  }

  return (
    <div className="flex-1 overflow-auto p-6 min-w-0">
      <h2 className="text-sm font-semibold mb-6">{t("settings.title")}</h2>

      <div className="space-y-6">
        {/* CLI tools directory */}
        <div className="space-y-2.5">
          <Label className="text-xs">{t("settings.cliDirLabel")}</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t("settings.cliDirDesc")}</p>
          {cliDir && (
            <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded break-all">
              {cliDir}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleOpenCliDir}>
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              {t("settings.openCliDir")}
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} title={t("settings.refreshTooltip")}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Data/settings directory */}
        <div className="pt-5 border-t space-y-2.5">
          <Label className="text-xs">{t("settings.dataDirLabel")}</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t("settings.dataDirDesc")}</p>
          {dataDir && (
            <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded break-all">
              {dataDir}
            </p>
          )}
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleOpenDataDir}>
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            {t("settings.openDataDir")}
          </Button>
        </div>

        {/* Language */}
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
