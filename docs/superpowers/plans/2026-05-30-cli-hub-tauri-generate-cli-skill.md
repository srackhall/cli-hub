# Generate-CLI Skill (Tauri Version) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` with a two-section design (Agent instructions + User copy-paste prompt), then delete the old `cli-hub/.claude/skills/generate-cli/SKILL.md`.

**Architecture:** Single self-contained SKILL.md file with Section A (Agent instructions — protocol spec, bilingual field rules, type mapping, x-steps, Go template, agent behavior) and Section B (fully self-contained web LLM prompt with role instruction, same protocol rules, Go template, and manual user steps). Both sections share the same protocol but are independently complete.

**Tech Stack:** Markdown, Go (template code only)

---

### Task 1: Create the SKILL.md file

**Files:**
- Create: `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p cli-hub-tauri/.claude/skills/generate-cli
```

- [ ] **Step 2: Write the SKILL.md file with full content**

Write the complete SKILL.md file at `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` with the content defined in the design spec — Section A (Agent instructions covering overview, protocol spec, bilingual fields, type mapping, x-steps, Go template, agent behavior) and Section B (self-contained web LLM prompt with role instruction, protocol rules, template, and manual steps), separated by HTML comment boundaries.

- [ ] **Step 3: Verify the file was created**

```bash
wc -l cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```
Expected: file exists with content

- [ ] **Step 4: Commit**

```bash
git add cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
git commit -m "feat: add generate-cli skill for Tauri version with Chinese-first design"
```

---

### Task 2: Delete the old skill file

**Files:**
- Delete: `cli-hub/.claude/skills/generate-cli/SKILL.md`

- [ ] **Step 1: Delete the old skill file**

```bash
rm cli-hub/.claude/skills/generate-cli/SKILL.md
```

- [ ] **Step 2: Remove empty parent directories if any**

```bash
rmdir cli-hub/.claude/skills/generate-cli 2>/dev/null || true
rmdir cli-hub/.claude/skills 2>/dev/null || true
rmdir cli-hub/.claude 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add cli-hub/.claude/skills/generate-cli/SKILL.md
git commit -m "chore: remove old generate-cli skill, superseded by cli-hub-tauri version"
```

---

### Task 3: Verify end-to-end

- [ ] **Step 1: Confirm new skill exists**

```bash
ls -la cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```

- [ ] **Step 2: Confirm old skill is gone**

```bash
ls cli-hub/.claude/skills/generate-cli/SKILL.md 2>&1 || echo "DELETED - OK"
```

- [ ] **Step 3: Verify git status is clean**

```bash
git status
```
Expected: clean working tree
