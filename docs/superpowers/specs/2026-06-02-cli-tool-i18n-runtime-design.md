# CLI Tool i18n Runtime & Bug Fix

**Date:** 2026-06-02  
**Status:** design-approved

## Scope

Fix i18n bugs in CLIhub client, add runtime output bilingual support for CLI tools, and improve the `generate-cli` skill to guide complete bilingual coverage.

### In scope
- Fix camelCase → snake_case schema JSON field mismatch (serde alias)
- Add `--lang` parameter passing from CLIhub to CLI tools
- Bilingualize executor status messages (Rust)
- Fix console resize drag direction (y-axis inversion)
- Fix sidebar tool description not following current language
- Update `generate-cli` skill with full bilingual templates
- Update `xlsx-extract` example tool with `--lang` support and snake_case schema

### Out of scope
- Frontend i18n translation files (`zh.json`/`en.json`) — already complete
- `useLocalizedSchema` hook — logic is correct
- `MainPanel.tsx` / `DynamicForm.tsx` — already uses localized schema correctly
- Settings persistence for language preference (saved to localStorage via i18next already)

## Architecture

### Data flow: Runtime bilingual output
```
User switches language in CLIhub
  → i18next stores preference in localStorage
  → MainPanel passes current lang to api.executeTool()
  → executor.rs appends --lang=zh/en to tool args
  → Tool receives --lang flag, selects correct string from bilingual map
  → Tool outputs in selected language to stdout
  → Console displays output as-is
```

### Data flow: Schema bilingual display (existing, confirmed working after fix)
```
Tool --schema outputs JSON with title_zh/description_zh etc.
  → Rust serde deserializes (now with camelCase alias support)
  → Frontend receives ToolSchema with snake_case fields populated
  → useLocalizedSchema picks title/title_zh based on current language
  → MainPanel/DynamicForm/Sidebar render localized text
```

## Changes

### 1. Rust backend: serde alias compatibility
**File:** `cli-hub-tauri/src-tauri/src/commands/tools.rs`

Add `#[serde(alias)]` to all `_zh` fields in `ToolSchema`, `SchemaProp`, `StepGroup`:
- `title_zh` ← alias `titleZh`
- `description_zh` ← alias `descriptionZh`
- `long_description_zh` ← alias `longDescriptionZh`

This allows Go tools to use either naming convention.

### 2. Rust backend: pass --lang to tools
**File:** `cli-hub-tauri/src-tauri/src/executor.rs`

- Add `lang: String` parameter to `execute_tool` command
- Prepend `--lang={lang}` to tool args before user params
- Replace hardcoded Chinese status messages with bilingual function `status_message(lang, kind)`

### 3. Rust backend: frontend api signature update
**File:** `cli-hub-tauri/src/api.ts`

- `executeTool` signature: add `lang: string` parameter

### 4. Frontend: MainPanel pass lang
**File:** `cli-hub-tauri/src/components/MainPanel.tsx`

- Get `i18n.language` via `useTranslation()`
- Pass `lang` to `api.executeTool()`

### 5. Frontend: Console resize fix
**File:** `cli-hub-tauri/src/hooks/useResizable.ts`

Invert y-axis delta: `startRef.current.startPos - currentPos` instead of `currentPos - startRef.current.startPos`.

This makes dragging the handle upward expand the console (natural direction).

### 6. Frontend: Sidebar tool description i18n
**File:** `cli-hub-tauri/src/components/Sidebar.tsx`

Change line 95 from hardcoded `description_zh` priority to follow current language:
```typescript
const desc = isZh ? (tool.description_zh || tool.description) : tool.description
```

### 7. Example tool: xlsx-extract update
**File:** `tools/xlsx-extract/main.go`

- Change schema field names to snake_case (`title_zh`, `description_zh`, etc.)
- Add `--lang` flag parsing
- Replace all `fmt.Printf` with bilingual map lookups
- Bilingual template pattern:
  ```go
  var messages = map[string]map[string]string{
      "extracting": {"zh": "正在提取...", "en": "Extracting..."},
      "done":       {"zh": "完成", "en": "Done"},
  }
  func msg(key string) string {
      if s, ok := messages[key][lang]; ok { return s }
      return messages[key]["en"]
  }
  ```

### 8. Skill: generate-cli improvements
**File:** `.claude/skills/generate-cli.md`

Add sections:
- **Field naming**: snake_case primary (`title_zh`), camelCase accepted via serde alias
- **`--lang` parameter**: required, values `zh`/`en`, with Go bilingual map template
- **Bilingual coverage checklist**: schema title/description, param descriptions, x-steps titles, runtime output, error messages
- **Exit codes**: 0=success, 1=param error, 2=runtime error

## Testing

- Build xlsx-extract with `--lang` support, import into CLIhub
- Switch language → verify schema displays in correct language
- Execute tool with `--lang zh` → verify Chinese runtime output
- Execute tool with `--lang en` → verify English runtime output
- Drag console resize handle up/down → verify natural direction
- Sidebar tool list → verify description follows language setting
