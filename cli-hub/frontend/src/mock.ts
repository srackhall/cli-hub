import type { ToolInfo, ToolSchema, LogEntry } from "@/types"

// Mock data for browser-based development and Playwright e2e testing.
// When running outside Wails (no window.go), this data feeds the UI.

export const MOCK_TOOLS: ToolInfo[] = [
  {
    name: "xlsx-merge",
    version: "1.2.0",
    description: "Merge multiple Excel files into a single workbook with configurable merge modes and sheet naming.",
    ready: true,
  },
  {
    name: "csv-clean",
    version: "0.9.1",
    description: "Clean and normalize CSV files — strip BOM, trim whitespace, re-encode to UTF-8.",
    ready: true,
  },
  {
    name: "report-gen",
    version: "2.0.0",
    description: "Generate PDF/HTML reports from JSON data templates with chart embedding.",
    ready: false,
    error: "missing dependency: chromedp",
  },
]

export const MOCK_SCHEMAS: Record<string, ToolSchema> = {
  "xlsx-merge": {
    title: "XLSX Merge",
    description: "Merge multiple Excel files into a single workbook.",
    type: "object",
    properties: {
      "input-files": {
        type: "array",
        description: "Input .xlsx files to merge",
        items: { type: "string" },
      },
      "output-dir": {
        type: "string",
        description: "Output directory for merged file",
        format: "directory-path",
      },
      "merge-mode": {
        type: "string",
        description: "How to merge sheets",
        enum: ["by-row", "by-sheet", "append"],
        default: "by-row",
      },
      "skip-empty": {
        type: "boolean",
        description: "Skip empty rows during merge",
        default: false,
      },
      "sheet-name": {
        type: "string",
        description: "Target sheet name for merged data",
        default: "Sheet1",
      },
      "max-rows": {
        type: "number",
        description: "Maximum rows to process per file",
        minimum: 1,
        maximum: 1000000,
      },
    },
    required: ["input-files", "output-dir"],
    "x-steps": [
      { title: "Select Files", fields: ["input-files", "output-dir"] },
      { title: "Merge Options", fields: ["merge-mode", "skip-empty", "sheet-name", "max-rows"] },
    ],
  },
  "csv-clean": {
    title: "CSV Cleaner",
    description: "Clean and normalize CSV files.",
    type: "object",
    properties: {
      "input-file": {
        type: "string",
        description: "Path to the CSV file to clean",
        format: "file-path",
      },
      "output-dir": {
        type: "string",
        description: "Directory for cleaned output",
        format: "directory-path",
      },
      "encoding": {
        type: "string",
        description: "Target encoding",
        enum: ["utf-8", "utf-16", "latin-1"],
        default: "utf-8",
      },
      "trim-whitespace": {
        type: "boolean",
        description: "Trim leading/trailing whitespace from all cells",
        default: true,
      },
    },
    required: ["input-file"],
  },
}

export function mockExecuteTool(
  toolName: string,
  _params: Record<string, unknown>,
  onLog: (entry: LogEntry) => void
): Promise<{ status: string; output: string; code: number }> {
  return new Promise((resolve) => {
    const lines = [
      { stream: "stdout" as const, text: `Starting ${toolName}...` },
      { stream: "stdout" as const, text: "Validating parameters..." },
      { stream: "stdout" as const, text: "Processing input files..." },
      { stream: "stdout" as const, text: "Merging data..." },
      { stream: "stdout" as const, text: "Writing output..." },
    ]
    let i = 0
    const timer = setInterval(() => {
      if (i < lines.length) {
        onLog({ ...lines[i], ts: Date.now() })
        i++
      } else {
        clearInterval(timer)
        onLog({ stream: "stdout", text: `SUCCESS (${toolName} completed in 1.2s)`, ts: Date.now() })
        resolve({ status: "ok", output: `${toolName} completed successfully`, code: 0 })
      }
    }, 200)
  })
}
