import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, FolderOpen, RefreshCw } from "lucide-react"
import { api } from "@/api"

interface SettingsProps {
  onRefreshTools: () => void
}

export function Settings({ onRefreshTools }: SettingsProps) {
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
      <h2 className="text-sm font-semibold mb-6">设置</h2>

      <div className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="cliPath" className="text-xs">CLI 工具存储路径</Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">指定用于存储和管理 CLI 工具的目录。cli/ 子目录将自动创建。</p>
          <div className="flex gap-2">
            <Input
              id="cliPath"
              value={cliPath}
              onChange={(e) => setCliPath(e.target.value)}
              placeholder="/path/to/cli/tools"
              className="flex-1 h-8 text-xs font-mono"
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} title="刷新工具列表">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
          <Save className="h-4 w-4 mr-1.5" />
          {saved ? "已保存" : "保存"}
        </Button>

        <div className="pt-5 border-t space-y-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">cli/ 目录将在指定路径创建，用于存储导入的工具。</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            设置和持久化数据存储在 cli/../db/settings.json
          </p>
        </div>
      </div>
    </div>
  )
}
