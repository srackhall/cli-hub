---
name: generate-cli
description: Generate Go CLI tools that comply with CLI Hub interface specification (--schema, --version, exit codes, x-steps)
---

# Generate CLI Hub-Compatible Go CLI Tool

Generate a standalone Go `main.go` file for a CLI tool that is automatically discoverable by the CLI Hub desktop application.

## Required Flags

Every generated CLI MUST implement these flags:

### --schema (Required)

Output valid JSON Schema describing all parameters. The JSON output MUST include:

```json
{
  "title": "Tool Display Name",
  "description": "What this tool does",
  "type": "object",
  "properties": { ... },
  "required": ["param1"]
}
```

Property type to UI component mapping:

| `type` | `format` | UI Component |
|--------|----------|-------------|
| `string` | (none) | Text input |
| `string` | `file-path` | Text input (placeholder: /path/to/file) |
| `string` | `directory-path` | Text input (placeholder: /path/to/dir) |
| `string` | (none) + `enum` | Select dropdown |
| `number` / `integer` | (none) | Number input (+ min/max if set) |
| `boolean` | (none) | Checkbox |
| `array` | (none) + `items: {type: string}` | Addable input list |

Each property object:
```json
{
  "type": "string",
  "description": "Human-readable label shown in UI",
  "default": "optional default value",
  "enum": ["a", "b"],
  "format": "file-path",
  "minimum": 1,
  "maximum": 100
}
```

### Multi-step Support (x-steps)

Use the `x-steps` extension to group parameters into sequential wizard steps:

```json
{
  "x-steps": [
    { "title": "Step 1: Select Files", "fields": ["input-files", "output-dir"] },
    { "title": "Step 2: Options", "fields": ["mode", "verbose"] }
  ]
}
```

- Each step has a `title` and `fields` (array of property names)
- Every property in `fields` MUST exist in `properties`
- Fields not listed in any step are hidden in the UI
- CLI receives all parameters at once; steps are pure frontend behavior

### --version (Recommended)

Output: `<name> v<semver> (protocol v1)`

Example: `xlsx-merge v1.2.0 (protocol v1)`

## Exit Code Convention

| Code | Meaning | UI Behavior |
|------|---------|------------|
| 0 | Success | Green success message in console |
| 1 | Parameter validation error | Red error, highlight invalid fields |
| 2 | Runtime error (file not found, format error, etc.) | Red error with details |

## Output Convention

- **stdout**: Normal progress messages, JSON result summary as last line: `{"status":"ok","output":"..."}`
- **stderr**: Error messages, progress hints

## Template

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

	// Define your flags here
	// inputFile := flag.String("input", "", "Path to input file")

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
	// 	fmt.Fprintln(os.Stderr, "ERROR: --input is required")
	// 	os.Exit(1)
	// }

	// Main logic here
	// ...
	// fmt.Println(`{"status":"ok","output":"done"}`)
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":       "Tool Name",
		"description": "Brief description of what this tool does.",
		"type":        "object",
		"properties": map[string]interface{}{
			"input-file": map[string]interface{}{
				"type":        "string",
				"description": "Path to the input file",
				"format":      "file-path",
			},
			"output-dir": map[string]interface{}{
				"type":        "string",
				"description": "Output directory",
				"format":      "directory-path",
			},
		},
		"required": []string{"input-file"},
	}
	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}
```

## Rules

1. Every parameter the CLI accepts MUST be declared in `--schema`
2. Use `flag` package (standard library) — no external dependencies
3. Default values in schema MUST match default values in flag definitions
4. `--schema` and `--version` MUST exit immediately after output (no side effects)
5. Last stdout line on success MUST be valid JSON: `{"status":"ok","output":"<summary>"}`
6. Compile to a standalone binary: `go build -o <name> .`
