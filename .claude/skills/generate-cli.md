---
name: generate-cli
description: Generate a Go CLI tool that complies with CLI Hub interface standards. Use when creating new data processing tools for the CLI Hub desktop app.
---

# Generate CLI Hub Tool

Generate a Go CLI tool that follows the CLI Hub interface specification. The generated code must implement `--schema`, `--version`, `--lang`, standard exit codes, and the agreed output format.

**Chinese-first design with full bilingual support.** All user-facing text must be provided in both Chinese (zh) and English (en), using snake_case JSON field names. The tool accepts `--lang=zh` or `--lang=en` to control runtime output language.

## Required Conventions

### --lang (Required)

All tools MUST accept `--lang=<value>` where value is `zh` or `en`. Default to `zh` if not provided. Use this to select runtime output language.

Bilingual string template (place near top of `main.go`):

```go
var lang = "zh"

var msgs = map[string]map[string]string{
    "usage":         {"zh": "用法: <tool> --schema|--version|--lang=zh|en|<params>", "en": "Usage: <tool> --schema|--version|--lang=zh|en|<params>"},
    "param_required": {"zh": "错误: --%s 是必需的", "en": "ERROR: --%s is required"},
    "file_not_found": {"zh": "错误: 文件未找到: %s", "en": "ERROR: file not found: %s"},
    "processing":    {"zh": "处理中...", "en": "Processing..."},
    "done":          {"zh": "完成: %s", "en": "Done: %s"},
    // Add tool-specific messages below
}

func msg(key string, args ...any) string {
    if m, ok := msgs[key]; ok {
        if s, ok := m[lang]; ok {
            if len(args) > 0 {
                return fmt.Sprintf(s, args...)
            }
            return s
        }
    }
    if len(args) > 0 {
        return fmt.Sprintf(key, args...)
    }
    return key
}
```

Parse `--lang` early in `main()`:

```go
func parseLang(rawArgs []string) string {
    for _, a := range rawArgs {
        if strings.HasPrefix(a, "--lang=") {
            v := strings.TrimPrefix(a, "--lang=")
            if v == "en" {
                return "en"
            }
            return "zh"
        }
        if a == "--lang" {
            // Next arg is value (handled in parseArgs)
        }
    }
    return "zh"
}
```

### --schema (Required)

Output JSON Schema describing all parameters. **Use snake_case for bilingual field names** (`title_zh`, `description_zh`). CamelCase (`titleZh`, `descriptionZh`) is also accepted by CLIhub via serde alias, but snake_case is the canonical form.

```json
{
  "title": "Tool Display Name",
  "title_zh": "工具显示名称",
  "description": "What this tool does",
  "description_zh": "工具的中文描述",
  "long_description": "Extended English description (optional)",
  "long_description_zh": "扩展中文描述（可选）",
  "type": "object",
  "properties": {
    "param-name": {
      "type": "string|number|integer|boolean|array",
      "description": "Human-readable description in English",
      "description_zh": "中文参数描述",
      "default": "default value (optional)",
      "enum": ["option1", "option2"],
      "format": "file-path|directory-path (optional)"
    }
  },
  "required": ["param-name"],
  "x-steps": [
    { "title": "Step 1: ...", "title_zh": "步骤 1：...", "fields": ["param1", "param2"] },
    { "title": "Step 2: ...", "title_zh": "步骤 2：...", "fields": ["param3"] }
  ]
}
```

### Bilingual Coverage Checklist

When generating a tool, ensure these items are bilingual:

- [ ] Schema `title` / `title_zh`
- [ ] Schema `description` / `description_zh`
- [ ] Schema `long_description` / `long_description_zh` (for complex tools)
- [ ] Each param `description` / `description_zh`
- [ ] Each step `title` / `title_zh` in `x-steps`
- [ ] Runtime output (progress, status, results) via `msg()` function
- [ ] Error messages via `msg()` function
- [ ] Usage/help text via `msg()` function

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
- stderr: Error messages

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
    "strings"
)

var lang = "zh"

var msgs = map[string]map[string]string{
    "usage":         {"zh": "用法: <tool> --schema|--version|--lang=zh|en|<params>", "en": "Usage: <tool> --schema|--version|--lang=zh|en|<params>"},
    "param_required": {"zh": "错误: --%s 是必需的", "en": "ERROR: --%s is required"},
    "file_not_found": {"zh": "错误: 文件未找到: %s", "en": "ERROR: file not found: %s"},
    "processing":    {"zh": "处理中...", "en": "Processing..."},
    "done":          {"zh": "完成: %s", "en": "Done: %s"},
}

func msg(key string, args ...any) string {
    if m, ok := msgs[key]; ok {
        if s, ok := m[lang]; ok {
            if len(args) > 0 {
                return fmt.Sprintf(s, args...)
            }
            return s
        }
    }
    if len(args) > 0 {
        return fmt.Sprintf(key, args...)
    }
    return key
}

func main() {
    if len(os.Args) < 2 {
        fmt.Fprintln(os.Stderr, msg("usage"))
        os.Exit(1)
    }

    // Parse --lang before anything else
    for _, a := range os.Args[1:] {
        if strings.HasPrefix(a, "--lang=") {
            v := strings.TrimPrefix(a, "--lang=")
            if v == "en" {
                lang = "en"
            }
            break
        }
    }

    switch os.Args[1] {
    case "--schema":
        b, _ := json.MarshalIndent(getSchema(), "", "  ")
        fmt.Println(string(b))
    case "--version":
        fmt.Println("<tool-name> v0.1.0 (protocol v1)")
    case "--lang":
        // --lang alone is ignored; already handled above
        // If --lang is the only arg and has no =value, show usage
        if len(os.Args) == 2 {
            fmt.Fprintln(os.Stderr, msg("usage"))
            os.Exit(1)
        }
        run()
    default:
        // Also check if first arg starts with --lang=
        if strings.HasPrefix(os.Args[1], "--lang=") {
            run()
            return
        }
        run()
    }
}

func getSchema() map[string]any {
    return map[string]any{
        "title":            "Tool Display Name",
        "title_zh":         "工具显示名称",
        "description":      "What this tool does in English",
        "description_zh":   "工具的中文描述",
        "type":             "object",
        "properties": map[string]any{
            "input": map[string]any{
                "type":           "string",
                "description":    "Input file path",
                "description_zh": "输入文件路径",
                "format":         "file-path",
            },
            "output": map[string]any{
                "type":           "string",
                "description":    "Output file path",
                "description_zh": "输出文件路径",
                "default":        "output.txt",
            },
        },
        "required": []string{"input"},
        "x-steps": []map[string]any{
            {
                "title":    "Step 1: Input & Output",
                "title_zh": "步骤 1：输入输出",
                "fields":   []string{"input", "output"},
            },
        },
    }
}

func run() {
    // Parse args, do work, output results using msg()
    // Last stdout line: {"status":"ok","output":"..."}
    // On error: os.Exit(1) or os.Exit(2)
    fmt.Println(msg("done", "output.txt"))
    fmt.Printf(`{"status":"ok","output":"..."}`+"\n")
}

// parseArgs converts ["--key", "val", "--flag"] into map["key"]="val", map["flag"]="true".
func parseArgs(raw []string) map[string]string {
    m := map[string]string{}
    for i := 0; i < len(raw); i++ {
        a := raw[i]
        // Skip --lang=... args — handled globally
        if strings.HasPrefix(a, "--lang=") || a == "--lang" {
            if a == "--lang" && i+1 < len(raw) {
                i++ // skip value
            }
            continue
        }
        if !strings.HasPrefix(a, "--") {
            continue
        }
        key := strings.TrimPrefix(a, "--")
        if i+1 < len(raw) && !strings.HasPrefix(raw[i+1], "--") {
            m[key] = raw[i+1]
            i++
        } else {
            m[key] = "true"
        }
    }
    return m
}

func parseIntArg(s string, defaultVal int) int {
    if s == "" {
        return defaultVal
    }
    v, err := strconv.Atoi(s)
    if err != nil {
        return defaultVal
    }
    return v
}
```

## Instructions

When the user describes what the CLI should do:

1. Identify all parameters (inputs, outputs, options)
2. Map each parameter to the correct JSON Schema type
3. If there are more than 4 parameters, group them into logical `x-steps`
4. Write bilingual descriptions for ALL user-facing text (schema fields, runtime output, errors)
5. Use snake_case JSON field names (`title_zh`, `description_zh`)
6. Generate complete, compilable Go code as a single `main.go` ready for `go build`
