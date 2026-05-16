import type { ToolInfo, ToolSchema, LogEntry } from "@/types"

// Mock data for browser-based development and Playwright e2e testing.
// When running outside Wails (no window.go), this data feeds the UI.

export const MOCK_TOOLS: ToolInfo[] = [
  {
    name: "xlsx-merge",
    version: "1.2.0",
    description: "Merge multiple Excel files into a single workbook with configurable merge modes and sheet naming.",
    descriptionZh: "将多个 Excel 文件合并为单个工作簿，支持可配置的合并模式和表命名。",
    longDescription: "A powerful CLI tool for merging Excel spreadsheets. Supports row-based merging, sheet-by-sheet combination, and simple append mode. Handles large files up to 1M rows with streaming I/O.",
    longDescriptionZh: "强大的 Excel 表格合并 CLI 工具。支持按行合并、逐表合并和简单追加模式。使用流式 I/O 处理高达百万行的大文件。",
    ready: true,
  },
  {
    name: "csv-clean",
    version: "0.9.1",
    description: "Clean and normalize CSV files — strip BOM, trim whitespace, re-encode to UTF-8.",
    descriptionZh: "清理和规范化 CSV 文件——去除 BOM、修剪空格、重新编码为 UTF-8。",
    longDescription: "A CSV sanitizer that handles common encoding issues: BOM removal, whitespace trimming, encoding conversion, and delimiter normalization. Ideal for preprocessing before data analysis.",
    longDescriptionZh: "CSV 清理工具，处理常见编码问题：去除 BOM、空格修剪、编码转换和分隔符规范化。非常适合数据分析前的预处理。",
    ready: true,
  },
  {
    name: "report-gen",
    version: "2.0.0",
    description: "Generate PDF/HTML reports from JSON data templates with chart embedding.",
    descriptionZh: "从 JSON 数据模板生成 PDF/HTML 报告，支持图表嵌入。",
    ready: false,
    error: "missing dependency: chromedp",
  },
]

export const MOCK_SCHEMAS: Record<string, ToolSchema> = {
  "xlsx-merge": {
    title: "XLSX Merge",
    titleZh: "XLSX 合并",
    description: "Merge multiple Excel files into a single workbook.",
    descriptionZh: "将多个 Excel 文件合并为单个工作簿。",
    longDescription: "Supports row-based merging, sheet-by-sheet combination, and simple append mode. Handles large files up to 1M rows with streaming I/O for memory efficiency. Output maintains cell formatting from the first input file.",
    longDescriptionZh: "支持按行合并、逐表合并和简单追加模式。使用流式 I/O 高效处理高达百万行的大文件，输出保留首个输入文件的单元格格式。",
    type: "object",
    properties: {
      "input-files": {
        type: "array",
        description: "Input .xlsx files to merge",
        descriptionZh: "要合并的 .xlsx 输入文件",
        items: { type: "string" },
      },
      "output-dir": {
        type: "string",
        description: "Output directory for merged file",
        descriptionZh: "合并后文件的输出目录",
        format: "directory-path",
      },
      "merge-mode": {
        type: "string",
        description: "How to merge sheets",
        descriptionZh: "工作表合并方式",
        enum: ["by-row", "by-sheet", "append"],
        default: "by-row",
      },
      "skip-empty": {
        type: "boolean",
        description: "Skip empty rows during merge",
        descriptionZh: "合并时跳过空行",
        default: false,
      },
      "sheet-name": {
        type: "string",
        description: "Target sheet name for merged data",
        descriptionZh: "合并数据的目标工作表名称",
        default: "Sheet1",
      },
      "max-rows": {
        type: "number",
        description: "Maximum rows to process per file",
        descriptionZh: "每个文件处理的最大行数",
        minimum: 1,
        maximum: 1000000,
      },
    },
    required: ["input-files", "output-dir"],
    "x-steps": [
      { title: "Select Files", titleZh: "选择文件", fields: ["input-files", "output-dir"] },
      { title: "Merge Options", titleZh: "合并选项", fields: ["merge-mode", "skip-empty", "sheet-name", "max-rows"] },
    ],
  },
  "csv-clean": {
    title: "CSV Cleaner",
    titleZh: "CSV 清理工具",
    description: "Clean and normalize CSV files.",
    descriptionZh: "清理和规范化 CSV 文件。",
    type: "object",
    properties: {
      "input-file": {
        type: "string",
        description: "Path to the CSV file to clean",
        descriptionZh: "要清理的 CSV 文件路径",
        format: "file-path",
      },
      "output-dir": {
        type: "string",
        description: "Directory for cleaned output",
        descriptionZh: "清理后文件的输出目录",
        format: "directory-path",
      },
      "encoding": {
        type: "string",
        description: "Target encoding",
        descriptionZh: "目标编码格式",
        enum: ["utf-8", "utf-16", "latin-1"],
        default: "utf-8",
      },
      "trim-whitespace": {
        type: "boolean",
        description: "Trim leading/trailing whitespace from all cells",
        descriptionZh: "修剪所有单元格的首尾空格",
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
