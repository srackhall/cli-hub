import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DynamicForm } from "@/components/DynamicForm"
import { useLocale } from "@/hooks/useLocale"
import { Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolSchema } from "@/types"

const IS_MOCK = typeof window !== "undefined" && !("go" in window)

interface MainPanelProps {
  selectedTool: string | null
  onLog: (entry: { stream: string; text: string; ts: number }) => void
}

export function MainPanel({ selectedTool, onLog }: MainPanelProps) {
  const { t } = useTranslation()
  const { text } = useLocale()
  const [schema, setSchema] = useState<ToolSchema | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [running, setRunning] = useState(false)

  // Load schema when tool changes
  useEffect(() => {
    if (!selectedTool) {
      setSchema(null)
      setValues({})
      setCurrentStep(0)
      return
    }

    async function load() {
      if (IS_MOCK) {
        const { MOCK_SCHEMAS } = await import("@/mock")
        setSchema(MOCK_SCHEMAS[selectedTool!] ?? null)
        setValues({})
        setCurrentStep(0)
        return
      }
      try {
        const s = await WailsApp.GetSchema(selectedTool ?? "")
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
      if (IS_MOCK) {
        const { mockExecuteTool } = await import("@/mock")
        const result = await mockExecuteTool(selectedTool, values, onLog)
        if (result && result.code === 0) {
          onLog({ stream: "stdout", text: t("console.success", { output: result.output }), ts: Date.now() })
        } else if (result) {
          onLog({ stream: "stderr", text: t("console.errorCode", { code: result.code, output: result.output }), ts: Date.now() })
        }
        setRunning(false)
        return
      }
      const result = await WailsApp.ExecuteTool(selectedTool ?? "", values)
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>{t("app.selectTool")}</p>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>{t("mainPanel.loading")}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{toolTitle}</h2>
          <Badge variant="secondary">{selectedTool}</Badge>
        </div>
        {toolDesc && (
          <p className="text-sm text-muted-foreground mt-1">{toolDesc}</p>
        )}
        {toolLongDesc && (
          <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed whitespace-pre-wrap">{toolLongDesc}</p>
        )}
      </div>

      {/* Step indicator */}
      {steps && steps.length > 1 && (
        <div className="px-6 py-2 border-b flex items-center gap-2 text-sm">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1">
              {idx > 0 && <span className="text-muted-foreground">/</span>}
              <span
                className={`${
                  idx === currentStep
                    ? "text-foreground font-medium"
                    : idx < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {text(step.title, step.titleZh)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Form body */}
      <div className="flex-1 overflow-auto px-6 py-4">
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
      <div className="px-6 py-3 border-t flex items-center justify-between">
        <div className="flex gap-2">
          {steps && currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {t("mainPanel.previous")}
            </Button>
          )}
          {steps && currentStep < steps.length - 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              {t("mainPanel.next")} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> {t("mainPanel.reset")}
          </Button>
          <Button size="sm" onClick={handleExecute} disabled={running}>
            <Play className="h-4 w-4 mr-1" /> {running ? t("mainPanel.running") : t("mainPanel.execute")}
          </Button>
        </div>
      </div>
    </div>
  )
}
