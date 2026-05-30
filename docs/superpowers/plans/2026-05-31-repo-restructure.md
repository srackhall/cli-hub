# Repo Restructure: Move tools/, Remove Wails

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `cli-hub/tools/` to repo root `tools/`, delete entire `cli-hub/` directory, and remove `build.yml` Wails CI workflow.

**Architecture:** Three sequential file-system operations: move tools out, delete Wails project, delete Wails CI. No code changes needed — `cli-hub-tauri/` has zero references to `cli-hub/`.

**Tech Stack:** Git, bash

---

### Task 1: Move tools/ to repo root

**Files:**
- Move: `cli-hub/tools/` → `tools/`

- [ ] **Step 1: Move the directory**

```bash
mv cli-hub/tools .
```

- [ ] **Step 2: Verify move succeeded**

Run: `ls tools/xlsx-extract/main.go`
Expected: file exists at new path

Run: `ls cli-hub/tools 2>&1`
Expected: "No such file or directory" (tools no longer under cli-hub)

- [ ] **Step 3: Commit**

```bash
git add tools/ cli-hub/tools
git commit -m "refactor: move tools/ from cli-hub/ to repo root"
```

---

### Task 2: Delete cli-hub/ Wails project

**Files:**
- Delete: `cli-hub/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf cli-hub/
```

- [ ] **Step 2: Verify deletion**

Run: `ls cli-hub 2>&1`
Expected: "No such file or directory"

- [ ] **Step 3: Commit**

```bash
git add cli-hub/
git commit -m "refactor: remove cli-hub/ Wails v3 project — superseded by cli-hub-tauri"
```

---

### Task 3: Delete Wails CI workflow

**Files:**
- Delete: `.github/workflows/build.yml`

- [ ] **Step 1: Delete the workflow**

```bash
rm .github/workflows/build.yml
```

- [ ] **Step 2: Verify deletion**

Run: `ls .github/workflows/build.yml 2>&1`
Expected: "No such file or directory"

Run: `ls .github/workflows/build-tauri.yml`
Expected: file exists (sole remaining CI workflow)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/build.yml
git commit -m "ci: remove Wails build workflow — superseded by build-tauri.yml"
```

---

### Task 4: Final verification

- [ ] **Step 1: Confirm final structure**

Run: `ls -d */`
Expected: `cli-hub/` NOT present; `tools/` IS present

- [ ] **Step 2: Confirm cli-hub-tauri intact**

```bash
cd cli-hub-tauri && npx tsc --noEmit
```
Expected: no TypeScript errors

- [ ] **Step 3: Push**

```bash
git push origin main
```
