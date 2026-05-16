export interface ToolInfo {
  name: string
  version: string
  description: string
  descriptionZh?: string
  longDescription?: string
  longDescriptionZh?: string
  ready: boolean
  error?: string
}

export interface ToolSchema {
  title?: string
  titleZh?: string
  description?: string
  descriptionZh?: string
  longDescription?: string
  longDescriptionZh?: string
  type: string
  properties: Record<string, SchemaProp>
  required?: string[]
  "x-steps"?: StepGroup[]
}

export interface SchemaProp {
  type: string
  description?: string
  descriptionZh?: string
  default?: unknown
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
  items?: { type: string }
}

export interface StepGroup {
  title: string
  titleZh?: string
  fields: string[]
}

export interface LogEntry {
  stream: "stdout" | "stderr"
  text: string
  ts: number
}
