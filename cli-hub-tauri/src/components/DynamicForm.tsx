import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { HelpTooltip } from "@/components/HelpTooltip"
import { FilePathInput } from "@/components/FilePathInput"
import { Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ToolSchema, SchemaProp } from "@/types"

interface DynamicFormProps {
  schema: ToolSchema
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function DynamicForm({ schema, values, onChange }: DynamicFormProps) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith("zh")

  const fields = Object.entries(schema.properties ?? {})

  return (
    <div className="space-y-5">
      {fields.map(([key, prop]) => (
        <FormField
          key={key}
          name={key}
          prop={prop}
          value={values[key]}
          onChange={(v) => onChange(key, v)}
          isZh={isZh}
        />
      ))}
    </div>
  )
}

function FormField({
  name,
  prop,
  value,
  onChange,
  isZh,
}: {
  name: string
  prop: SchemaProp
  value: unknown
  onChange: (v: unknown) => void
  isZh: boolean
}) {
  const { t } = useTranslation()
  const label = isZh ? (prop.description_zh || prop.description || name) : (prop.description || name)

  if (prop.type === "boolean") {
    return (
      <div className="flex items-center gap-3 py-1">
        <Checkbox
          id={name}
          checked={(value as boolean) ?? (prop.default as boolean) ?? false}
          onCheckedChange={(checked) => onChange(checked)}
          className="h-4 w-4"
        />
        <Label htmlFor={name} className="cursor-pointer text-xs">
          {label}
        </Label>
        <HelpTooltip paramKey={name} description={label} />
      </div>
    )
  }

  if (prop.enum && prop.enum.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <HelpTooltip paramKey={name} description={label} />
        </div>
        <Select
          value={(value as string) ?? (prop.default as string) ?? ""}
          onValueChange={(v) => onChange(v === "__empty__" ? "" : v)}
        >
          <SelectTrigger id={name} className="h-8 text-xs">
            <SelectValue placeholder={t("dynamicForm.selectPlaceholder", { label })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">(无)</SelectItem>
            {prop.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (prop.type === "number" || prop.type === "integer") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <HelpTooltip paramKey={name} description={label} />
        </div>
        <Input
          id={name}
          type="number"
          min={prop.minimum}
          max={prop.maximum}
          value={(value as number | string) ?? (prop.default as number | string) ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? "" : Number(e.target.value)
            onChange(v)
          }}
          className="h-8 text-xs"
        />
      </div>
    )
  }

  if (prop.type === "array" && prop.items?.type === "string") {
    const items = (value as string[]) ?? (prop.default as string[]) ?? []
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">{label}</Label>
          <HelpTooltip paramKey={name} description={label} />
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = e.target.value
                  onChange(next)
                }}
                className="h-8 text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx)
                  onChange(next)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange([...items, ""])}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("dynamicForm.addItem")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={name} className="text-xs">{label}</Label>
        <HelpTooltip paramKey={name} description={label} />
      </div>
      <FilePathInput
        id={name}
        value={(value as string) ?? (prop.default as string) ?? ""}
        onChange={(v) => onChange(v)}
        placeholder={prop.format === "file-path" ? "/path/to/file" : prop.format === "directory-path" ? "/path/to/dir" : ""}
        isDirectory={prop.format === "directory-path"}
      />
    </div>
  )
}
