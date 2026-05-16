import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DynamicForm } from "@/components/DynamicForm"
import { Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import * as WailsApp from "@bindings/changeme/app"
import type { ToolSchema } from "@/types"

interface MainPanelProps {
  selectedTool: string | null
  onLog: (entry: { stream: string; text: string; ts: number }) => void
}

export function MainPanel({ selectedTool, onLog }: MainPanelProps) {
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
      try {
        const s = await WailsApp.GetSchema(selectedTool ?? "")
        if (s) {
          setSchema(s as unknown as ToolSchema)
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
      return [{ title: "Parameters", fields: Object.keys(schema.properties) }]
    }
    return xsteps
  }, [schema])

  const currentFields = steps?.[currentStep]?.fields ?? []

  const handleExecute = async () => {
    if (!selectedTool) return
    setRunning(true)
    onLog({ stream: "stdout", text: `Starting ${selectedTool}...`, ts: Date.now() })
    try {
      const result = await WailsApp.ExecuteTool(selectedTool ?? "", values)
      if (result && result.code === 0) {
        onLog({ stream: "stdout", text: `SUCCESS (${result.output})`, ts: Date.now() })
      } else if (result) {
        onLog({ stream: "stderr", text: `ERROR [code ${result.code}]: ${result.output}`, ts: Date.now() })
      }
    } catch (e) {
      onLog({ stream: "stderr", text: `Execution failed: ${e}`, ts: Date.now() })
    }
    setRunning(false)
  }

  const handleReset = () => {
    setValues({})
    setCurrentStep(0)
  }

  if (!selectedTool) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a tool from the sidebar to get started.</p>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{schema.title ?? selectedTool}</h2>
          <Badge variant="secondary">{selectedTool}</Badge>
        </div>
        {schema.description && (
          <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
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
                {step.title}
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
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
          )}
          {steps && currentStep < steps.length - 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleExecute} disabled={running}>
            <Play className="h-4 w-4 mr-1" /> {running ? "Running..." : "Execute"}
          </Button>
        </div>
      </div>
    </div>
  )
}
