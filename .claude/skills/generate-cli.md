---
name: generate-cli
description: Generate a Go CLI tool that complies with CLI Hub interface standards. Use when creating new data processing tools for the CLI Hub desktop app.
---

# Generate CLI Hub Tool

Generate a Go CLI tool that follows the CLI Hub interface specification. The generated code must implement `--schema`, `--version`, standard exit codes, and the agreed output format.

## Required Conventions

### --schema (Required)

Output JSON Schema describing all parameters:

```json
{
  "title": "Tool Display Name",
  "description": "What this tool does",
  "type": "object",
  "properties": {
    "param-name": {
      "type": "string|number|integer|boolean|array",
      "description": "Human-readable description",
      "default": "default value (optional)",
      "enum": ["option1", "option2"],
      "format": "file-path|directory-path (optional)"
    }
  },
  "required": ["param-name"],
  "x-steps": [
    { "title": "Step 1: ...", "fields": ["param1", "param2"] },
    { "title": "Step 2: ...", "fields": ["param3"] }
  ]
}
```

### Field Type Mapping

| JSON Schema | UI Component |
|------------|-------------|
| `string` | Text input |
| `string` + `format: "file-path"` | File picker |
| `string` + `format: "directory-path"` | Directory picker |
| `string` + `enum: [...]` | Dropdown select |
| `number` / `integer` | Number input |
| `boolean` | Checkbox |
| `array` + `items: {type: string}` | Addable input list |

### Exit Codes

- `0` — Success
- `1` — Parameter error (validation failed)
- `2` — Runtime error (file not found, format error, etc.)

### Output Format

- stdout: Normal logs; last line must be JSON: `{"status":"ok","output":"..."}`
- stderr: Error messages and progress lines as JSON: `{"progress":50,"message":"..."}`

### --version

Output: `<name> v<semver> (protocol v1)`

## Code Template

Generate a `main.go` file:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

func main() {
    if len(os.Args) < 2 {
        fmt.Fprintln(os.Stderr, "Usage: <tool> --schema|--version|<params>")
        os.Exit(1)
    }

    switch os.Args[1] {
    case "--schema":
        b, _ := json.MarshalIndent(getSchema(), "", "  ")
        fmt.Println(string(b))
    case "--version":
        fmt.Println("<tool-name> v0.1.0 (protocol v1)")
    default:
        run()
    }
}

func getSchema() map[string]any {
    // Define parameters per the schema above
    return map[string]any{
        "title":       "...",
        "description": "...",
        "type":        "object",
        "properties":  map[string]any{},
        "required":    []string{},
    }
}

func run() {
    // Parse args, do work, output results
    // Last stdout line: {"status":"ok","output":"..."}
    // On error: os.Exit(1) or os.Exit(2)
}
```

## Instructions

When the user describes what the CLI should do:

1. Identify all parameters (inputs, outputs, options)
2. Map each parameter to the correct JSON Schema type
3. If there are more than 4 parameters, group them into logical `x-steps`
4. Generate complete, compilable Go code
5. The generated code must be a single `main.go` ready for `go build`
