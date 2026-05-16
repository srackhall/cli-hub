# CLI Hub - Design Document

**Date**: 2026-05-12
**Status**: Design Approved

## 1. Problem Statement

The team has many Go CLI tools (xlsx processing, txt processing, data cleaning pipelines, etc.). Existing users use the command line to operate them. As the customer base expands, many customers are not comfortable with the command line and need a desktop client interface.

Core requirements:
- UI as a universal adaptation layer for CLI tools, dynamically adapting to different CLIs
- CLIs can be dynamically imported/removed, zero coupling with the UI
- Support for multi-step parameter configuration
- Maintain an AI prompt (Skill) to ensure AI-generated CLIs naturally comply with project standards

## 2. Tech Stack

- **Desktop Framework**: Wails v3 (pure Go WebView bindings, no CGO dependency)
- **Frontend**: Vite + React + TypeScript + shadcn/ui
- **CLI**: Go standalone binaries, placed in tools/ directory
- **Cross-platform**: macOS / Windows / Linux

## 3. Overall Architecture

```
┌─────────────────────────────────┐
│         Desktop App             │
│  ┌───────────────────────────┐  │
│  │    React + shadcn/ui      │  │
│  │  ┌──────────┐ ┌──────────┐│  │
│  │  │Tool List │ │Param Form││  │
│  │  │(dynamic) │ │(dynamic) ││  │
│  │  └──────────┘ └──────────┘│  │
│  │  ┌───────────────────────┐│  │
│  │  │  Execution Log Panel  ││  │
│  │  └───────────────────────┘│  │
│  └───────────┬───────────────┘  │
│              │ Wails Bridge      │
│  ┌───────────▼───────────────┐  │
│  │      Go Backend           │  │
│  │  - Scan tools/ directory  │  │
│  │  - Call CLI --schema      │  │
│  │  - os/exec run tasks      │  │
│  │  - Capture/stream output  │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ os/exec
    ┌──────────▼──────────┐
    │    tools/           │
    │  ├─ xlsx-merge      │
    │  ├─ csv-clean       │
    │  └─ report-gen      │
    └─────────────────────┘
```

## 4. CLI Interface Specification

Each CLI tool must comply with the following conventions to work properly in the UI:

### 4.1 --schema (Required)

Output JSON Schema describing all parameters, including types, defaults, validation rules, and help text. Schema supports the following extensions:

| JSON Schema Keyword | UI Component Mapping |
|--------------------|----------------------|
| `string` (no format) | `Input` text field |
| `string` + `format: "file-path"` | File picker (native dialog) |
| `string` + `format: "directory-path"` | Directory picker |
| `string` + `enum` | `Select` dropdown |
| `number` / `integer` | `Input` (type=number) + min/max |
| `boolean` | `Checkbox` |
| `array` (string items) | Addable/removable input list |

### 4.2 Multi-step Support

Declare parameter grouping order via the custom extension field `x-steps` in the schema:

```json
{
  "x-steps": [
    { "title": "Step 1: Select files", "fields": ["input-files", "output-dir"] },
    { "title": "Step 2: Merge options", "fields": ["merge-mode", "skip-empty"] }
  ],
  "properties": { ... }
}
```

The frontend navigates steps based on `x-steps`. The CLI itself still executes in one shot; multi-step interaction is purely frontend behavior.

### 4.3 Exit Code Convention

| Exit Code | Meaning |
|----------|---------|
| 0 | Success |
| 1 | Parameter error (validation failed) |
| 2 | Runtime error (file not found, format exception, etc.) |

### 4.4 Output Format

- **stdout**: Normal runtime logs, last line outputs JSON result summary `{"status":"ok","output":"..."}`
- **stderr**: Error messages and progress hints
- **Progress**: Output via stderr lines, each line JSON format `{"progress":50,"message":"Processing..."}`

### 4.5 --version (Recommended)

Output semantic version + protocol version: `xlsx-merge v1.2.0 (protocol v1)`

## 5. Frontend Design

### 5.1 UI Layout

```
┌─ CLI Hub ────────────────────────┬─ Settings ─┐
├───────────────┬──────────────────────────────┤
│  Tool List    │   Parameter Form             │
│               │                              │
│  [Search...]  │   xlsx-merge        v1.2.0   │
│  ─────────    │   ──────────────────────     │
│  > xlsx-merge │   Merge multiple xlsx files  │
│    (selected) │                              │
│    csv-clean  │   Input files     [...] [+Add]│
│    report-gen │   Output dir      [...]       │
│    txt-split  │   Merge mode      [By Row v] │
│               │   [x] Skip empty rows        │
│               │   Sheet name       [Sheet1 ]  │
│               │                              │
│               │   [Reset Params]  [Execute]  │
├───────────────┴──────────────────────────────┤
│  Execution Log                               │
│  ─────────────────────────────────────────── │
│  [09:32:01] Starting xlsx-merge...           │
│  [09:32:04] SUCCESS (2.3s elapsed)           │
├───────────────┬──────────────────────────────┤
│  Status Bar    │  tools/ (5 tools) All Ready  │
└───────────────┴──────────────────────────────┘
```

### 5.2 Component Tree

```
App
├── Sidebar
│   ├── SearchInput          // Search filter
│   └── ToolList             // Dynamic tool list
│       └── ToolItem[]       // Name + version + status indicator
├── Main
│   ├── ToolHeader           // Tool name + version + description
│   ├── StepIndicator        // Multi-step indicator (optional)
│   ├── DynamicForm           // Rendered dynamically from schema
│   │   └── FormField[]       // Input / Select / Checkbox / FilePicker
│   └── ActionBar            // Reset + Execute buttons
├── Console
│   └── LogEntry[]           // Real-time log stream
└── StatusBar                // Tool count + ready status
```

### 5.3 State Management

Using React Context + useReducer:

- `tools`: Scanned tool list with name, version, status (ready/unavailable)
- `selectedTool`: Currently selected tool name
- `currentSchema`: Current tool's JSON Schema
- `formValues`: Current form field values
- `executionState`: idle | running | success | error
- `logs`: Execution log array

### 5.4 File Selection

- When clicking file/directory picker, call native system dialog via Wails
- Wails v3 provides `dialog.OpenFile()` / `dialog.OpenDirectory()` API

## 6. Backend Design

### 6.1 Exported Functions (Frontend Calls)

| Function | Description |
|----------|-------------|
| `ListTools() -> []ToolInfo` | Scan tools/ directory, return tool list |
| `GetSchema(name string) -> object` | Call `./tools/name --schema`, return JSON Schema |
| `ExecuteTool(name string, params map[string]any)` | Execute CLI, push real-time logs via event stream |

### 6.2 Real-time Log Push

CLI stdout/stderr output is produced line by line during execution. The backend pushes each line to the frontend via `Runtime.Events.Emit("tool-output", ...)`. The frontend Console panel displays real-time scrolling.

### 6.3 Tool Scan Flow

```
Startup → Scan tools/ → Call --schema for each
  ├─ Success → Parse schema → Mark "ready"
  └─ Failure (timeout 30s / invalid JSON) → Mark "unavailable"
```

### 6.4 Error Handling Layers

- CLI exit code 0 → Frontend shows success, displays output summary
- CLI exit code 1 → Frontend highlights parameter error
- CLI exit code 2 → Frontend displays runtime error details
- CLI crash/timeout → Backend captures, marks as "system error"

## 7. AI CLI Generation Loop

### 7.1 Overall Flow

```
Developer Daily Work
  │
  ├─ Natural language requirements → AI + generate-cli Skill → Go CLI binary
  │                                                                  │
  └────────────── Compile and put into tools/ ←─────────────────────┘
                              │
                              ▼
                  Desktop app auto-detects, ready to use
```

### 7.2 generate-cli Skill

Using Claude Code Skill format, defines the complete interface specification for project CLIs. When a developer describes requirements in AI, the Skill automatically injects specification constraints, ensuring the generated code includes:

- `--schema` outputting standard JSON Schema
- `--version` outputting version info
- Standard exit codes
- Agreed stdout/stderr format

Skill file is placed in the project's `.claude/skills/` directory, managed with project git.

### 7.3 Distribution Model

1. Customer installs the desktop app
2. Developer uses AI + Skill to quickly generate custom CLI based on customer needs
3. Developer sends the compiled CLI binary to the customer
4. Customer places the binary into tools/ directory, desktop app auto-detects it
5. Customer uses it through the UI form, no command line needed

## 8. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI execution | Standalone binary + os/exec | Zero coupling, dynamic add/remove |
| Parameter description | CLI self-describing --schema | No extra maintenance burden, always in sync |
| Multi-step support | Schema x-steps extension | No CLI logic changes, pure frontend steps |
| Prompt carrier | Claude Code Skill | Callable, structured, version-controlled with project |
| File selection | Native dialog | Desktop app experience, not web file upload |

## 9. Acceptance Criteria

1. Launch desktop app, automatically scan tools/ directory and display all CLI tools
2. Click a tool, automatically render the corresponding form based on schema
3. Fill in parameters and click execute, see real-time execution logs
4. Exit code 0 shows success, exit code 1/2 shows corresponding errors
5. New tool: compile binary and put into tools/, restart app to recognize
6. Multi-step tool: form paginated by steps, form state preserved between steps
