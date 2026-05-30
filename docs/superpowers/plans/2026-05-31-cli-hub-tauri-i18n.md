# i18n Internationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add react-i18next internationalization to CLI Hub Tauri with auto language detection, Chinese/English translation files, useLocalizedSchema hook, and language switcher in top bar and Settings.

**Architecture:** Install react-i18next + i18next + i18next-browser-languagedetector, create translation JSON files (zh/en), i18n init config, and useLocalizedSchema hook. Import i18n in main.tsx, then migrate all 7 component files to use `t()` calls. Add language toggle in App.tsx and language selector in Settings.tsx.

**Tech Stack:** react-i18next, i18next, i18next-browser-languagedetector

---

### Task 1: Install dependencies and create translation files

**Files:**
- Create: `cli-hub-tauri/src/i18n/locales/zh.json`
- Create: `cli-hub-tauri/src/i18n/locales/en.json`

- [ ] **Step 1: Install npm packages**

```bash
cd cli-hub-tauri && npm i react-i18next i18next i18next-browser-languagedetector
```

- [ ] **Step 2: Create zh.json translation file**

Write `cli-hub-tauri/src/i18n/locales/zh.json` with all ~38 Chinese translation keys organized by namespace (nav, sidebar, main, dynamicForm, console, statusBar, settings, theme, dialog).

- [ ] **Step 3: Create en.json translation file**

Write `cli-hub-tauri/src/i18n/locales/en.json` with all ~38 English translation keys organized by the same namespaces.

- [ ] **Step 4: Commit**

```bash
git add cli-hub-tauri/package.json cli-hub-tauri/package-lock.json cli-hub-tauri/src/i18n/locales/
git commit -m "feat: add i18next dependencies and translation files (zh/en)"
```

---

### Task 2: Create i18n init and useLocalizedSchema hook

**Files:**
- Create: `cli-hub-tauri/src/i18n/index.ts`
- Create: `cli-hub-tauri/src/i18n/useLocalizedSchema.ts`
- Modify: `cli-hub-tauri/src/main.tsx`

- [ ] **Step 1: Create i18n initialization config**

Write `cli-hub-tauri/src/i18n/index.ts` with i18next init using LanguageDetector, react-i18next, zh/en resources, fallback to zh.

- [ ] **Step 2: Create useLocalizedSchema hook**

Write `cli-hub-tauri/src/i18n/useLocalizedSchema.ts` — takes ToolSchema | null, returns schema with title/description/properties/x-steps resolved to current language.

- [ ] **Step 3: Import i18n config in main.tsx**

Add `import "./i18n"` at the top of `cli-hub-tauri/src/main.tsx` (before any component imports).

- [ ] **Step 4: Commit**

```bash
git add cli-hub-tauri/src/i18n/index.ts cli-hub-tauri/src/i18n/useLocalizedSchema.ts cli-hub-tauri/src/main.tsx
git commit -m "feat: add i18n init config and useLocalizedSchema hook"
```

---

### Task 3: Migrate Sidebar component

**Files:**
- Modify: `cli-hub-tauri/src/components/Sidebar.tsx`

- [ ] **Step 1: Replace hardcoded Chinese with t() calls**

Add `import { useTranslation } from "react-i18next"` and `const { t } = useTranslation()` to Sidebar. Replace: "搜索工具..." → `t("sidebar.search")`, "导入" → `t("sidebar.import")`, "..." → `t("sidebar.importing")`, "删除工具" → `t("sidebar.delete")`, "错误" → `t("sidebar.error")`, placeholder text → `t("sidebar.noTools")` / `t("sidebar.noMatch")`, dialog confirm → `t("dialog.deleteConfirm", { name })`, import dialog title → `t("dialog.importTitle")`.

- [ ] **Step 2: Commit**

```bash
git add cli-hub-tauri/src/components/Sidebar.tsx
git commit -m "feat: migrate Sidebar to i18n"
```

---

### Task 4: Migrate MainPanel component

**Files:**
- Modify: `cli-hub-tauri/src/components/MainPanel.tsx`

- [ ] **Step 1: Use useLocalizedSchema and replace hardcoded Chinese**

Import `useTranslation` and `useLocalizedSchema`. Replace `schema?.title_zh || schema?.title` pattern with `localized?.title`. Replace: "参数" → dynamic from hook, "上一步" → `t("main.previousStep")`, "下一步" → `t("main.nextStep")`, "重置" → `t("main.reset")`, "执行" → `t("main.execute")`, "运行中..." → `t("main.running")`, log templates → parameterized t() calls. Replace hardcoded placeholder text.

- [ ] **Step 2: Commit**

```bash
git add cli-hub-tauri/src/components/MainPanel.tsx
git commit -m "feat: migrate MainPanel to i18n with useLocalizedSchema"
```

---

### Task 5: Migrate remaining components (DynamicForm, Console, StatusBar, Settings, App, FilePathInput)

**Files:**
- Modify: `cli-hub-tauri/src/components/DynamicForm.tsx`
- Modify: `cli-hub-tauri/src/components/Console.tsx`
- Modify: `cli-hub-tauri/src/components/StatusBar.tsx`
- Modify: `cli-hub-tauri/src/components/Settings.tsx`
- Modify: `cli-hub-tauri/src/components/FilePathInput.tsx`
- Modify: `cli-hub-tauri/src/App.tsx`

- [ ] **Step 1: Migrate DynamicForm**

Replace `prop.description_zh || prop.description` with `useLocalizedSchema`. Replace "选择 {{label}}..." → `t("dynamicForm.selectPlaceholder", { label })`, "添加" → `t("dynamicForm.addItem")`.

- [ ] **Step 2: Migrate Console**

Replace "就绪。选择一个工具并点击执行开始。" → `t("console.ready")`.

- [ ] **Step 3: Migrate StatusBar**

Replace `{toolCount} 个工具` → `t("statusBar.toolCount", { count: toolCount })`.

- [ ] **Step 4: Migrate Settings**

Replace all hardcoded Chinese labels/descriptions with t() calls. Add language selector `<Select>` with options "中文" and "English" using existing Select UI component.

- [ ] **Step 5: Migrate App.tsx**

Replace "工具" → `t("nav.tools")`, "设置" → `t("nav.settings")`, theme tooltips → `t("theme.switchToLight")` / `t("theme.switchToDark")`. Add language toggle button next to theme button.

- [ ] **Step 6: Migrate FilePathInput**

Replace dialog titles "选择目录"/"选择文件" → `t("dialog.selectDir")` / `t("dialog.selectFile")`.

- [ ] **Step 7: Commit**

```bash
git add cli-hub-tauri/src/components/DynamicForm.tsx cli-hub-tauri/src/components/Console.tsx cli-hub-tauri/src/components/StatusBar.tsx cli-hub-tauri/src/components/Settings.tsx cli-hub-tauri/src/components/FilePathInput.tsx cli-hub-tauri/src/App.tsx
git commit -m "feat: migrate all remaining components to i18n"
```

---

### Task 6: Verify end-to-end

- [ ] **Step 1: Check TypeScript compilation**

```bash
cd cli-hub-tauri && npx tsc --noEmit 2>&1 | head -30
```
Expected: no TS errors (or only pre-existing ones unrelated to i18n).

- [ ] **Step 2: Verify no hardcoded Chinese UI strings remain**

Search for remaining hardcoded Chinese in component files.

- [ ] **Step 3: Verify git status**

```bash
git status
```

- [ ] **Step 4: Commit any final fixes**
