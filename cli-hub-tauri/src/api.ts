import { invoke } from "@tauri-apps/api/core";

export interface ToolInfo {
  name: string;
  version: string;
  description: string;
  description_zh: string;
  long_description: string;
  long_description_zh: string;
  ready: boolean;
  error: string;
}

export interface ToolSchema {
  title: string;
  title_zh: string;
  description: string;
  description_zh: string;
  long_description: string;
  long_description_zh: string;
  type: string;
  properties: Record<string, SchemaProp>;
  required: string[];
  "x-steps": StepGroup[];
}

export interface SchemaProp {
  type: string;
  description: string;
  description_zh: string;
  default: unknown;
  enum: string[];
  format: string;
  minimum: number;
  maximum: number;
  items: { type: string } | null;
}

export interface StepGroup {
  title: string;
  title_zh: string;
  fields: string[];
}

export interface AppSettings {
  cli_path: string;
}

export interface ExecuteResult {
  status: string;
  output: string;
  code: number;
}

export interface LogEntry {
  stream: "stdout" | "stderr";
  text: string;
  ts: number;
}

export const api = {
  listTools: () => invoke<ToolInfo[]>("list_tools"),

  getSchema: (name: string) =>
    invoke<ToolSchema>("get_tool_schema", { name }),

  importTool: (sourcePath: string) =>
    invoke<string>("import_tool", { sourcePath }),

  deleteTool: (name: string) =>
    invoke<void>("delete_tool", { name }),

  executeTool: (name: string, params: Record<string, unknown>) =>
    invoke<ExecuteResult>("execute_tool", { name, params }),

  refreshTools: () => invoke<void>("refresh_tools"),

  getSettings: () => invoke<AppSettings>("get_settings"),

  updateSettings: (settings: AppSettings) =>
    invoke<void>("update_settings", { settings }),

  getToolsDir: () => invoke<string>("get_tools_dir"),
};
