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
import { Plus, Trash2 } from "lucide-react"
import type { ToolSchema, SchemaProp } from "@/types"

interface DynamicFormProps {
  schema: ToolSchema
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function DynamicForm({ schema, values, onChange }: DynamicFormProps) {
  const fields = Object.entries(schema.properties ?? {})

  return (
    <div className="space-y-4">
      {fields.map(([key, prop]) => (
        <FormField
          key={key}
          name={key}
          prop={prop}
          value={values[key]}
          onChange={(v) => onChange(key, v)}
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
}: {
  name: string
  prop: SchemaProp
  value: unknown
  onChange: (v: unknown) => void
}) {
  const label = prop.description ?? name
  const isRequired = false

  // Boolean -> Checkbox
  if (prop.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={name}
          checked={value as boolean ?? prop.default as boolean ?? false}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
      </div>
    )
  }

  // Enum -> Select
  if (prop.enum && prop.enum.length > 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Select
          value={(value as string) ?? (prop.default as string) ?? ""}
          onValueChange={(v) => onChange(v === "__empty__" ? "" : v)}
        >
          <SelectTrigger id={name}>
            <SelectValue placeholder={`Select ${label}...`} />
          </SelectTrigger>
          <SelectContent>
            {!isRequired && <SelectItem value="__empty__">(none)</SelectItem>}
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

  // number / integer
  if (prop.type === "number" || prop.type === "integer") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
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
        />
      </div>
    )
  }

  // array of strings
  if (prop.type === "array" && prop.items?.type === "string") {
    const items = (value as string[]) ?? (prop.default as string[]) ?? []
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
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
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx)
                  onChange(next)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, ""])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    )
  }

  // string (default) — covers file-path, directory-path, and plain strings
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        value={(value as string) ?? (prop.default as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prop.format === "file-path" ? "/path/to/file" : prop.format === "directory-path" ? "/path/to/dir" : ""}
      />
    </div>
  )
}
