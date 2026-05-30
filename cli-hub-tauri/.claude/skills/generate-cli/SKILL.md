---
name: generate-cli
description: Generate Go CLI tools that comply with CLI Hub Tauri interface specification (--schema, --version, exit codes, x-steps), with Chinese-first UI design
---

# Generate CLI Hub-Compatible Go CLI Tool (Tauri)

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- SECTION A — AGENT INSTRUCTIONS (Claude Code)                        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Section A: Agent Instructions

### A1. Overview

This skill generates standalone Go `main.go` files for CLI tools that are
automatically discoverable by **CLI Hub Tauri** — a desktop application
that wraps CLI tools with a visual UI (forms, wizards, file pickers, console).

The agent, upon reading this section, should autonomously:
1. Understand the user's CLI tool requirements through conversation
2. Generate a complete `main.go` file matching this spec
3. Compile with `go build -o <tool-name> .`
4. Verify `--schema` outputs valid JSON and `--version` outputs correctly
5. Report completion with the compiled binary path — done. No manual steps for the user.

---

### A2. Protocol Specification

Every generated CLI MUST implement these flags:

#### --schema (Required)

Output valid JSON Schema describing all parameters to stdout, then exit 0.
The JSON structure follows the CLI Hub Tauri interface (see A3 for field details).

#### --version (Recommended)

Output: `<name> v<semver> (protocol v1)`

Example: `file-renamer v0.1.0 (protocol v1)`

#### Exit Code Convention

| Code | Meaning              | UI Behavior                          |
|------|----------------------|--------------------------------------|
| 0    | Success              | Green success message in console     |
| 1    | Param validation err | Red error, highlight invalid fields  |
| 2    | Runtime error        | Red error with details               |

#### Output Convention

- **stdout**: Normal progress messages, JSON result as last line: `{"status":"ok","output":"<summary>"}`
- **stderr**: Error messages, progress hints

---

### A3. Bilingual Schema Fields (Chinese-First)

Schema root object MUST include these fields:

| Field               | Language | Purpose                            |
|---------------------|----------|------------------------------------|
| `title`             | English  | Tool name in sidebar (fallback)    |
| `titleZh`           | Chinese  | **Primary** display name in UI     |
| `description`       | English  | One-line summary (fallback)        |
| `descriptionZh`     | Chinese  | **Primary** one-line summary       |
| `longDescription`   | English  | Detailed docs (fallback)           |
| `longDescriptionZh` | Chinese  | **Primary** detailed docs in UI    |

Each property object in `properties`:

```json
{
  "type": "string",
  "description": "Label shown in form UI (English)",
  "descriptionZh": "UI 中显示的中文标签",
  "default": "optional default value",
  "enum": ["a", "b"],
  "format": "file-path | directory-path",
  "minimum": 1,
  "maximum": 100
}
```

Property `description` / `descriptionZh` — Label shown in the form UI. Both required.

Step `title` / `titleZh` in x-steps — Step name in the wizard. Both required when using x-steps.

**Design principle:** Chinese fields (`*Zh`) are the PRIMARY display language for
the Tauri client UI. English fields serve as fallbacks and for technical accuracy.
Write Chinese descriptions with **non-technical end users** in mind — they will
read these labels in a visual form. Use clear, friendly Chinese that guides the
user through each parameter.

**Parameter naming:** Use English kebab-case for flag names (e.g. `input-file`,
`output-dir`). The `description` fields provide the i18n layer — CLI Hub displays
them in the current language. The CLI itself only sees English flags at runtime.

---

### A4. Type → UI Component Mapping

| `type`           | `format`          | UI Component                    |
|------------------|-------------------|---------------------------------|
| `string`         | (none)            | Text input                      |
| `string`         | `file-path`       | File picker + text input        |
| `string`         | `directory-path`  | Directory picker + text input   |
| `string` + `enum`| (none)            | Select dropdown                 |
| `number`/`integer`| (none)           | Number input (+ min/max if set) |
| `boolean`        | (none)            | Checkbox                        |
| `array`          | `items: {string}` | Addable input list              |

---

### A5. Multi-step Support (x-steps)

Use the `x-steps` extension to group parameters into sequential wizard steps:

```json
{
  "x-steps": [
    {
      "title": "Step 1: Select Files",
      "titleZh": "步骤 1：选择文件",
      "fields": ["input-files", "output-dir"]
    },
    {
      "title": "Step 2: Options",
      "titleZh": "步骤 2：选项",
      "fields": ["mode", "verbose"]
    }
  ]
}
```

- Each step has `title` (English), `titleZh` (Chinese), and `fields` (array of property names)
- Every property in `fields` MUST exist in `properties`
- Fields not listed in any step are hidden in the UI
- CLI receives all parameters at once; steps are pure frontend behavior

---

### A6. Go Template

```go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
)

func main() {
	schemaFlag := flag.Bool("schema", false, "Output JSON Schema")
	versionFlag := flag.Bool("version", false, "Output version info")

	// Define your flags here — example:
	// inputFile := flag.String("input-file", "", "Path to input file")
	// outputDir := flag.String("output-dir", "", "Output directory")
	// mode := flag.String("mode", "default", "Operation mode")
	// verbose := flag.Bool("verbose", false, "Verbose output")

	flag.Parse()

	if *schemaFlag {
		outputSchema()
		return
	}
	if *versionFlag {
		fmt.Println("tool-name v0.1.0 (protocol v1)")
		return
	}

	// Validate required parameters
	// if *inputFile == "" {
	// 	fmt.Fprintln(os.Stderr, "ERROR: --input-file is required")
	// 	os.Exit(1)
	// }

	// Main logic here
	// ...
	// fmt.Println(`{"status":"ok","output":"done"}`)
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":              "Tool Name",
		"titleZh":            "工具名称",
		"description":        "Brief description of what this tool does.",
		"descriptionZh":      "该工具功能的简要说明。",
		"longDescription":    "Detailed explanation of usage, features, and caveats.\nSupports multi-line text.",
		"longDescriptionZh":  "详细的用途、功能和注意事项说明。\n支持多行文本。",
		"type":               "object",
		"properties": map[string]interface{}{
			"input-file": map[string]interface{}{
				"type":          "string",
				"description":   "Path to the input file",
				"descriptionZh": "输入文件的路径",
				"format":        "file-path",
			},
			"output-dir": map[string]interface{}{
				"type":          "string",
				"description":   "Output directory",
				"descriptionZh": "输出目录",
				"format":        "directory-path",
			},
			"mode": map[string]interface{}{
				"type":          "string",
				"description":   "Operation mode",
				"descriptionZh": "操作模式",
				"enum":          []string{"fast", "thorough"},
				"default":       "fast",
			},
			"verbose": map[string]interface{}{
				"type":          "boolean",
				"description":   "Enable verbose output",
				"descriptionZh": "启用详细输出",
				"default":       false,
			},
		},
		"required": []string{"input-file"},
		"x-steps": []map[string]interface{}{
			{
				"title":   "Step 1: Select Files",
				"titleZh": "步骤 1：选择文件",
				"fields":  []string{"input-file", "output-dir"},
			},
			{
				"title":   "Step 2: Options",
				"titleZh": "步骤 2：选项",
				"fields":  []string{"mode", "verbose"},
			},
		},
	}
	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}
```

---

### A7. Rules

1. Every parameter the CLI accepts MUST be declared in `--schema`
2. Use `flag` package (standard library) — no external dependencies
3. Default values in schema MUST match default values in flag definitions
4. `--schema` and `--version` MUST exit immediately after output (no side effects)
5. Last stdout line on success MUST be valid JSON: `{"status":"ok","output":"<summary>"}`
6. Compile to a standalone binary: `go build -o <name> .`

---

### A8. Agent Behavior

When invoked as a Claude Code skill (`/generate-cli`), the agent MUST:

1. Understand the user's CLI tool requirements through conversation
2. Generate a complete `main.go` file matching all rules in this spec
3. Compile the binary: `go build -o <tool-name> .`
4. Verify: `./<tool-name> --schema` outputs valid JSON
5. Verify: `./<tool-name> --version` outputs correct format
6. Report completion with the compiled binary path

The agent handles the full lifecycle — no manual steps required for the user.

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- SECTION B — USER COPY-PASTE PROMPT                                 -->
<!-- COPY EVERYTHING BELOW TO A WEB LLM (ChatGPT, Claude.ai, etc.)      -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

## Section B: Web LLM Prompt

Copy the entire content below this line into a web-based LLM (ChatGPT, Claude.ai, etc.).

---

You are an expert Go developer building CLI tools for **CLI Hub Tauri**,
a desktop application that gives CLI tools a visual UI. The app displays
tool parameters as forms, supports multi-step wizards, file/directory
pickers, and shows execution output in a console.

Your task: generate a complete Go `main.go` file for the CLI tool described
by the user. Output the code in a markdown code block, then provide
step-by-step manual instructions for the user to compile and import it.

---

## 1. Protocol Requirements

The generated CLI MUST support these flags:

### --schema (Required)
Output valid JSON Schema describing all parameters to stdout, then exit 0.

```json
{
  "title": "Tool Display Name",
  "titleZh": "工具中文名称",
  "description": "What this tool does (one line, English)",
  "descriptionZh": "该工具的功能说明（一行，中文）",
  "longDescription": "Detailed explanation of usage, features, and caveats (multi-line, English)",
  "longDescriptionZh": "详细的用途、功能和注意事项说明（多行，中文）",
  "type": "object",
  "properties": { ... },
  "required": ["param1"],
  "x-steps": [ ... ]
}
```

### --version (Recommended)
Output: `<name> v<semver> (protocol v1)`

Example: `file-renamer v0.1.0 (protocol v1)`

### Exit Code Convention

| Code | Meaning              |
|------|----------------------|
| 0    | Success              |
| 1    | Param validation err |
| 2    | Runtime error        |

### Output Convention

- **stdout**: Normal progress messages. Last line MUST be valid JSON: `{"status":"ok","output":"<summary>"}`
- **stderr**: Error messages, progress hints

---

## 2. Bilingual Fields (Chinese-First)

**CRITICAL:** CLI Hub Tauri is a Chinese-first desktop app. Chinese fields (`*Zh`)
are the PRIMARY display language in the UI. Write them for **non-technical users**
who will read these labels in a visual form. Use clear, friendly Chinese that
guides the user through each parameter.

| Field                   | Language | Shown In              |
|-------------------------|----------|-----------------------|
| `title`                 | English  | Sidebar (fallback)    |
| `titleZh`               | Chinese  | Sidebar (**primary**) |
| `description`           | English  | Tool header (fallback)|
| `descriptionZh`         | Chinese  | Tool header (**primary**)|
| `longDescription`       | English  | Tool detail (fallback)|
| `longDescriptionZh`     | Chinese  | Tool detail (**primary**)|
| Property `description`  | English  | Form label (fallback) |
| Property `descriptionZh`| Chinese  | Form label (**primary**)|
| x-steps `title`         | English  | Wizard tab (fallback) |
| x-steps `titleZh`       | Chinese  | Wizard tab (**primary**)|

**Parameter naming:** Use English kebab-case for CLI flag names (e.g. `input-file`,
`output-dir`). The `descriptionZh` provides the Chinese label — the CLI itself
only sees English flags at runtime.

---

## 3. Type → UI Component Mapping

| `type`           | `format`          | UI Component                    |
|------------------|-------------------|---------------------------------|
| `string`         | (none)            | Text input                      |
| `string`         | `file-path`       | File picker + text input        |
| `string`         | `directory-path`  | Directory picker + text input   |
| `string` + `enum`| (none)            | Select dropdown                 |
| `number`/`integer`| (none)           | Number input (+ min/max if set) |
| `boolean`        | (none)            | Checkbox                        |
| `array`          | `items: {string}` | Addable input list              |

---

## 4. Multi-step Wizard (x-steps)

Group fields into sequential wizard steps so the UI presents them one group at a time:

```json
{
  "x-steps": [
    {
      "title": "Step 1: Select Files",
      "titleZh": "步骤 1：选择文件",
      "fields": ["input-files", "output-dir"]
    },
    {
      "title": "Step 2: Options",
      "titleZh": "步骤 2：选项",
      "fields": ["mode", "verbose"]
    }
  ]
}
```

Rules:
- Every field in `fields` MUST exist in `properties`
- Fields not listed in any step are hidden in the UI
- CLI receives all parameters at once; steps are pure frontend behavior

---

## 5. Rules

1. Every parameter the CLI accepts MUST be declared in `--schema`
2. Use `flag` package (standard library) — **no external dependencies**
3. Default values in schema MUST match default values in flag definitions
4. `--schema` and `--version` MUST exit immediately after output (no side effects)
5. Last stdout line on success MUST be valid JSON: `{"status":"ok","output":"<summary>"}`
6. Compile to a standalone binary: `go build -o <name> .`

---

## 6. Code Template

```go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
)

func main() {
	schemaFlag := flag.Bool("schema", false, "Output JSON Schema")
	versionFlag := flag.Bool("version", false, "Output version info")

	// Define your flags here — example:
	// inputFile := flag.String("input-file", "", "Path to input file")
	// outputDir := flag.String("output-dir", "", "Output directory")

	flag.Parse()

	if *schemaFlag {
		outputSchema()
		return
	}
	if *versionFlag {
		fmt.Println("tool-name v0.1.0 (protocol v1)")
		return
	}

	// Validate required parameters
	// if *inputFile == "" {
	// 	fmt.Fprintln(os.Stderr, "ERROR: --input-file is required")
	// 	os.Exit(1)
	// }

	// Main logic here
	// ...
	// fmt.Println(`{"status":"ok","output":"done"}`)
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":              "Tool Name",
		"titleZh":            "工具名称",
		"description":        "Brief description of what this tool does.",
		"descriptionZh":      "该工具功能的简要说明。",
		"longDescription":    "Detailed explanation of usage, features, and caveats.\nSupports multi-line text.",
		"longDescriptionZh":  "详细的用途、功能和注意事项说明。\n支持多行文本。",
		"type":               "object",
		"properties": map[string]interface{}{
			"input-file": map[string]interface{}{
				"type":          "string",
				"description":   "Path to the input file",
				"descriptionZh": "输入文件的路径",
				"format":        "file-path",
			},
			"output-dir": map[string]interface{}{
				"type":          "string",
				"description":   "Output directory",
				"descriptionZh": "输出目录",
				"format":        "directory-path",
			},
		},
		"required": []string{"input-file"},
		"x-steps": []map[string]interface{}{
			{
				"title":   "Step 1: Select Files",
				"titleZh": "步骤 1：选择文件",
				"fields":  []string{"input-file", "output-dir"},
			},
		},
	}
	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}
```

---

## 7. After Generating Code — Manual Steps for the User

After outputting the code, provide these instructions to the user:

**Step 1:** Copy the generated code and save as `main.go`

**Step 2:** Compile the binary:
```bash
go build -o <tool-name> .
```

**Step 3:** Open CLI Hub Tauri desktop app, click the **"导入"** (Import) button
in the sidebar, and select the compiled binary

**Step 4:** Verify the tool appears in the sidebar. Test `--schema` and
`--version` to confirm it works correctly

---

Now, based on the requirements above, generate the complete `main.go`
for the user's described CLI tool. Output the code in a markdown code
block first, then list the manual steps.

<!-- END COPY -->
