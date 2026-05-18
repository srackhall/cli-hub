import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DynamicForm } from "@/components/DynamicForm"
import { useLocale } from "@/hooks/useLocale"
import { Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { api, type ToolSchema, type LogEntry } from "@/api"

interface MainPanelProps {
  selectedTool: string | null
  onLog: (entry: LogEntry) => void
}

export function MainPanel({ selectedTool, onLog }: MainPanelProps) {
  const { t } = useTranslation()
  const { text } = useLocale()
  const [schema, setSchema] = useState<ToolSchema | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!selectedTool) {
      setSchema(null)
      setValues({})
      setCurrentStep(0)
      return
    }

    async function load() {
      try {
        const s = await api.getSchema(selectedTool!)
        if (s) {
          setSchema(s as ToolSchema)
        }
        setValues({})
        setCurrentStep(0)
      } catch (e) {
        setSchema(null)
      }
    }
    load()
  }, [selectedTool])

  const steps = useMemo(() => {
    if (!schema?.properties) return null
    const xsteps = schema["x-steps"]
    if (!xsteps || xsteps.length === 0) {
      return [{ title: t("mainPanel.parameters"), titleZh: undefined, fields: Object.keys(schema.properties) }]
    }
    return xsteps
  }, [schema])

  const currentFields = steps?.[currentStep]?.fields ?? []

  const handleExecute = async () => {
    if (!selectedTool) return
    setRunning(true)
    onLog({ stream: "stdout", text: t("console.starting", { tool: selectedTool }), ts: Date.now() })
    try {
      const result = await api.executeTool(selectedTool!, values)
      if (result && result.code === 0) {
        onLog({ stream: "stdout", text: t("console.success", { output: result.output }), ts: Date.now() })
      } else if (result) {
        onLog({ stream: "stderr", text: t("console.errorCode", { code: result.code, output: result.output }), ts: Date.now() })
      }
    } catch (e) {
      onLog({ stream: "stderr", text: t("console.execFailed", { error: String(e) }), ts: Date.now() })
    }
    setRunning(false)
  }

  const handleReset = () => {
    setValues({})
    setCurrentStep(0)
  }

  const toolTitle = text(schema?.title, schema?.titleZh) ?? selectedTool
  const toolDesc = text(schema?.description, schema?.descriptionZh)
  const toolLongDesc = text(schema?.longDescription, schema?.longDescriptionZh)

  if (!selectedTool) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/50 mx-auto mb-4 flex items-center justify-center">
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("app.selectTool")}</p>
        </div>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">{t("mainPanel.loading")}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold truncate">{toolTitle}</h2>
          <Badge variant="secondary" className="shrink-0 text-[10px] font-mono px-1.5">{selectedTool}</Badge>
        </div>
        {toolDesc && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{toolDesc}</p>
        )}
        {toolLongDesc && (
          <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4">{toolLongDesc}</p>
        )}
      </div>

      {/* Step indicator */}
      {steps && steps.length > 1 && (
        <div className="px-6 py-2 border-b flex items-center gap-2 text-[11px] shrink-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-border">/</span>}
              <button
                className={`transition-colors duration-150 ${
                  idx === currentStep
                    ? "text-accent font-medium"
                    : idx < currentStep
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/40"
                }`}
                onClick={() => idx < currentStep && setCurrentStep(idx)}
              >
                {text(step.title, step.titleZh)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form body */}
      <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
        {schema && (
          <DynamicForm
            schema={{
              ...schema,
              properties: Object.fromEntries(
                currentFields.map((f) => [f, schema.properties![f]]).filter(([, p]) => !!p)
              ),
            }}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />
        )}
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-t flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          {steps && currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("mainPanel.previous")}
            </Button>
          )}
          {steps && currentStep < steps.length - 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              {t("mainPanel.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t("mainPanel.reset")}
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={running}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-4"
          >
            <Play className="h-4 w-4 mr-1.5" />
            {running ? t("mainPanel.running") : t("mainPanel.execute")}
          </Button>
        </div>
      </div>
    </div>
  )
}
