const API_BASE = "http://127.0.0.1:9246"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

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

export interface AppSettings {
  cliPath: string
}

export interface ExecuteResult {
  status: string
  output: string
  code: number
}

export interface LogEntry {
  stream: "stdout" | "stderr"
  text: string
  ts: number
}

export const api = {
  listTools: () => request<ToolInfo[]>("/api/tools"),

  getSchema: (name: string) =>
    request<ToolSchema>(`/api/tools/${encodeURIComponent(name)}/schema`),

  importTool: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${API_BASE}/api/tools`, {
      method: "POST",
      body: form,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `${res.status} ${res.statusText}`)
    }
    return res.json() as Promise<{ status: string; name: string }>
  },

  deleteTool: (name: string) =>
    request<{ status: string }>(`/api/tools/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),

  executeTool: (name: string, params: Record<string, unknown>) =>
    request<ExecuteResult>(
      `/api/tools/${encodeURIComponent(name)}/execute`,
      { method: "POST", body: JSON.stringify(params) }
    ),

  refreshTools: () =>
    request<{ status: string }>("/api/tools/refresh", { method: "POST" }),

  getSettings: () => request<AppSettings>("/api/settings"),

  updateSettings: (settings: AppSettings) =>
    request<{ status: string }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
}
