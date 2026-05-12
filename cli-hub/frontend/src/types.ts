export interface ToolInfo {
  name: string
  version: string
  description: string
  ready: boolean
  error?: string
}

export interface ToolSchema {
  title?: string
  description?: string
  type: string
  properties: Record<string, SchemaProp>
  required?: string[]
  "x-steps"?: StepGroup[]
}

export interface SchemaProp {
  type: string
  description?: string
  default?: unknown
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
  items?: { type: string }
}

export interface StepGroup {
  title: string
  fields: string[]
}

export interface LogEntry {
  stream: "stdout" | "stderr"
  text: string
  ts: number
}
