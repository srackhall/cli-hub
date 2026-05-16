# CLI Hub Remaining Work Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** Complete remaining cleanup, smoke-test the desktop app, add native file dialogs, and finalize the generate-cli Skill.

**Architecture:** Wails v3 Go backend + React/TypeScript frontend with shadcn/ui. Typed bindings auto-generated from Go structs. Events system for real-time output streaming.

**Tech Stack:** Go 1.21+, Wails v3.0.0-alpha.90, React 18, TypeScript 5, Vite, Tailwind CSS v4, shadcn/ui

---

## Task 1: Type cast cleanup

- [ ] **Step 1:** In `MainPanel.tsx` line 33, remove `as unknown as ToolSchema` cast
- [ ] **Step 2:** Instead, use `as ToolSchema` directly since bindings return a structurally compatible shape
- [ ] **Step 3:** Run `npx tsc --noEmit` to verify zero type errors
- [ ] **Step 4:** Run `npm run build` to verify production build passes

## Task 2: End-to-end smoke test

- [ ] **Step 1:** Run `wails3 dev` to launch the desktop app
- [ ] **Step 2:** Verify xlsx-merge appears in sidebar tool list with "ready" status
- [ ] **Step 3:** Click xlsx-merge, verify DynamicForm renders with all fields
- [ ] **Step 4:** Enter test parameters and click Execute
- [ ] **Step 5:** Verify Console shows real-time stdout/stderr output
- [ ] **Step 6:** Verify StatusBar shows correct tool count

## Task 3: Native file dialogs

- [ ] **Step 1:** Add Go backend method `OpenFileDialog()` calling Wails dialog API
- [ ] **Step 2:** Add Go backend method `OpenDirectoryDialog()` calling Wails dialog API
- [ ] **Step 3:** Expose via Wails bindings (add to App struct methods)
- [ ] **Step 4:** Regenerate TypeScript bindings (`wails3 task generate`)
- [ ] **Step 5:** Wire file-path format fields to trigger native dialog in DynamicForm
- [ ] **Step 6:** Wire directory-path format fields similarly

## Task 4: generate-cli Skill finalization

- [ ] **Step 1:** Create `.claude/skills/generate-cli/` directory
- [ ] **Step 2:** Write SKILL.md encoding full CLI interface specification
- [ ] **Step 3:** Verify Skill produces a Go main.go that passes `--schema` validation
- [ ] **Step 4:** Test end-to-end: generate a mock CLI → compile → place in tools/ → app discovers it
