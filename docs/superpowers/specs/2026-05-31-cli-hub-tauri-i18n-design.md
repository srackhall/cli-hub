# Design Spec: i18n Internationalization for CLI Hub Tauri

**Date:** 2026-05-31
**Status:** Proposed

## 1. Motivation

CLI Hub Tauri currently has all UI text hardcoded in Chinese (~30+ strings across 7 files), while tool schemas already support bilingual fields (`title`/`titleZh`, `description`/`descriptionZh`, etc.). Adding i18n enables:

- English-speaking users to use the desktop client
- Consistent language switching across both UI chrome AND tool schema content
- Clean separation of display text from component logic

## 2. Scope

**In scope:**
- Install and configure `react-i18next` + `i18next` + `i18next-browser-languagedetector`
- Extract all ~30 hardcoded Chinese strings into `zh.json` and `en.json` translation files
- Create `useLocalizedSchema()` hook to replace scattered `*_zh || english` fallback patterns
- Add language switcher button in top bar (中/EN toggle)
- Add language selector in Settings page
- Auto-detect system language on first launch, persist choice to localStorage
- Replace all hardcoded Chinese text in 7 component files with `t()` calls
- Replace schema `*_zh || english` fallbacks in MainPanel and DynamicForm with hook

**Out of scope:**
- Changing the bilingual field structure in tool schemas — stays as-is
- Modifying the `generate-cli` skill — already compatible
- RTL language support
- Translation of tool-generated output (stdout/stderr)
- Go backend i18n

## 3. Architecture

### 3.1 Tech Stack

| Component | Library |
|-----------|---------|
| React binding | `react-i18next` |
| Core engine | `i18next` |
| Language detection | `i18next-browser-languagedetector` |

### 3.2 File Structure

```
cli-hub-tauri/
  src/
    i18n/
      index.ts                    # i18n init: LanguageDetector + react-i18next
      locales/
        zh.json                   # Chinese translations (~45 keys)
        en.json                   # English translations (~45 keys)
      useLocalizedSchema.ts       # Schema language adapter hook
    main.tsx                      # Import i18n config (1 line change)
    App.tsx                       # Replace hardcoded CN + add lang toggle button
    components/
      Sidebar.tsx                 # Replace hardcoded CN
      MainPanel.tsx               # Use useLocalizedSchema + replace hardcoded CN
      DynamicForm.tsx             # Use useLocalizedSchema + replace hardcoded CN
      Console.tsx                 # Replace hardcoded CN
      Settings.tsx                # Replace hardcoded CN + add language selector
      StatusBar.tsx               # Replace hardcoded CN
      FilePathInput.tsx           # Replace hardcoded CN in dialog titles
```

### 3.3 Data Flow

```
navigator.language  ──→  LanguageDetector  ──→  i18next.language
                                                      │
                    ┌─────────────────────────────────┤
                    ▼                                 ▼
           useTranslation()                  useLocalizedSchema(schema)
           ("工具" → "Tools")                (titleZh → title)
                    │                                 │
                    ▼                                 ▼
              UI 组件文本                       Tool Schema 展示
```

Language detection order: `navigator.language` → `localStorage` (cached). Falls back to `zh`.

## 4. Translation Key Design

Keys are organized by component namespace:

| Namespace | Key count | Examples |
|-----------|-----------|----------|
| `nav` | 2 | "工具"/"Tools", "设置"/"Settings" |
| `sidebar` | 8 | "导入"/"Import", "搜索工具..."/"Search tools..." |
| `main` | 11 | "执行"/"Execute", "上一步"/"Previous", log templates |
| `dynamicForm` | 2 | "添加"/"Add", select placeholder |
| `console` | 1 | ready state message |
| `statusBar` | 1 | "{n} 个工具"/"{n} tools" |
| `settings` | 7 | labels, descriptions, language selector |
| `theme` | 2 | dark/light mode tooltips |
| `dialog` | 4 | file picker titles, delete confirmation |

Total: ~38 unique translation keys.

### 4.1 Parameterized Strings

Some strings use i18next interpolation with `{{variable}}`:

- `statusBar.toolCount`: `"{{count}} 个工具"` → `"{{count}} tools"`
- `main.startLog`: `"启动 {{name}}..."` → `"Starting {{name}}..."`
- `main.successLog`: `"成功 ({{output}})"` → `"Success ({{output}})"`
- `main.errorLog`: `"错误 [code {{code}}]: {{output}})"` → `"Error [code {{code}}]: {{output}}"`
- `main.execErrorLog`: `"执行失败: {{error}}"` → `"Execution failed: {{error}}"`
- `dynamicForm.selectPlaceholder`: `"选择 {{label}}..."` → `"Select {{label}}..."`
- `dialog.deleteConfirm`: `"从 CLI Hub 移除 {{name}}？..."` → `"Remove {{name}} from CLI Hub?..."`

## 5. useLocalizedSchema Hook

```typescript
// src/i18n/useLocalizedSchema.ts

import { useTranslation } from "react-i18next"
import type { ToolSchema } from "@/api"

export function useLocalizedSchema(schema: ToolSchema | null) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith("zh")

  if (!schema) return null

  return {
    ...schema,
    title: isZh ? (schema.title_zh || schema.title) : schema.title,
    description: isZh ? (schema.description_zh || schema.description) : schema.description,
    long_description: isZh
      ? (schema.long_description_zh || schema.long_description)
      : schema.long_description,
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([key, prop]) => [
        key,
        {
          ...prop,
          description: isZh
            ? (prop.description_zh || prop.description)
            : prop.description,
        },
      ])
    ),
    "x-steps": schema["x-steps"]?.map((step) => ({
      ...step,
      title: isZh ? (step.title_zh || step.title) : step.title,
    })),
  }
}
```

**Before (MainPanel.tsx):**
```tsx
const toolTitle = schema?.title_zh || schema?.title || selectedTool
const toolDesc = schema?.description_zh || schema?.description
```

**After (MainPanel.tsx):**
```tsx
const localized = useLocalizedSchema(schema)
const toolTitle = localized?.title || selectedTool
const toolDesc = localized?.description
```

Note: `Sidebar.tsx` uses `ToolInfo.description_zh` directly — this is NOT handled by the hook since `ToolInfo` is a different type. Sidebar has its own simple fallback `tool.description_zh || tool.description` which stays as-is (already simple and clear).

## 6. Language Switcher UX

### 6.1 Top Bar Button (App.tsx)

A compact toggle button next to the theme button:
- Shows "中" when in English mode (click to switch to Chinese)
- Shows "EN" when in Chinese mode (click to switch to English)
- Tooltip: "切换到中文" / "Switch to English"

### 6.2 Settings Page Selector (Settings.tsx)

A `<Select>` dropdown in Settings, below the CLI path section:
- Label: "界面语言" / "Interface Language"
- Description: explains auto-detection behavior
- Options: "中文" and "English"
- Uses the existing `Select` UI component

### 6.3 Auto-Detection

On first launch, `i18next-browser-languagedetector` reads `navigator.language`:
- `zh*` → Chinese
- Anything else → English

User choice is persisted to `localStorage`. Changing in Settings or top bar updates both `i18next.language` and `localStorage`.

## 7. Implementation Steps

1. Install npm packages: `react-i18next`, `i18next`, `i18next-browser-languagedetector`
2. Create `src/i18n/locales/zh.json` and `src/i18n/locales/en.json`
3. Create `src/i18n/index.ts` (i18n initialization)
4. Create `src/i18n/useLocalizedSchema.ts` (schema adapter hook)
5. Import i18n config in `src/main.tsx`
6. Migrate components: Sidebar → MainPanel → DynamicForm → Console → StatusBar → Settings → App → FilePathInput
7. Add language toggle button to App.tsx
8. Add language selector to Settings.tsx
9. Test: switch languages, verify UI text and schema content update
10. Commit

## 8. Key Design Decisions

| Decision | Rationale |
|----------|----------|
| react-i18next over custom solution | Mature ecosystem, language detection, interpolation, React Suspense support |
| Single namespace (`translation`) | ~38 keys doesn't warrant multiple namespaces. Simple `t('sidebar.import')` pattern. |
| useLocalizedSchema hook vs inline `||` | Centralizes the language logic. Components just use `localized.title` without knowing about `*_zh` fields. |
| ToolInfo NOT handled by hook | Sidebar's `tool.description_zh \|\| tool.description` is a single occurrence — wrapping it in a hook adds complexity with no benefit. |
| `navigator` detection before `localStorage` | First launch gets system language automatically; subsequent visits respect user preference. |
| `console.error` strings left as-is | Log output is for developers, not users. i18n for console.error adds overhead with no UX benefit. |

## 9. Success Criteria

- [ ] Language auto-detected from system on first launch
- [ ] Toggling language in top bar instantly switches all UI text
- [ ] Settings page language selector works and persists preference
- [ ] Tool schema display (title, description, properties, x-steps) follows language selection
- [ ] All ~38 translation keys exist in both zh.json and en.json with correct values
- [ ] No remaining hardcoded Chinese UI strings in component files
- [ ] Existing functionality (tool import, execution, form input) unaffected
