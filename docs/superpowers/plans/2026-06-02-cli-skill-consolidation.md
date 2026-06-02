# Skill Consolidation + Makefile Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the duplicate `generate-cli` skill into a single source of truth at `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`, append a Makefile generation section, and create a directory symlink so agents can discover it from the repo root.

**Architecture:** Three atomic changes — (1) revert and delete the stale root-level `generate-cli.md`, (2) append the "Build: Makefile" section to the canonical tauri skill, (3) create a `项目根/.claude/skills/generate-cli → cli-hub-tauri/...` directory symlink. The `tools/xlsx-extract/Makefile` is already created and verified (commit `b878c31`).

**Tech Stack:** Git, POSIX shell (`ln -s`), markdown editing

**Prerequisite context:**
- `tools/xlsx-extract/Makefile` already exists and passes `make build`/`make build-all`/`make clean` (verified in commit `b878c31`)
- `项目根/.claude/skills/generate-cli.md` (358 lines, old version) was wrongly updated in commit `7c0565a` — this needs to be reverted and deleted
- `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` (517 lines, canonical two-section design) has NOT yet received the Makefile section

---

### Task 1: Revert and delete stale root-level skill file

**Files:**
- Delete: `项目根/.claude/skills/generate-cli.md`

**Context:** Commit `7c0565a` appended the Makefile section to the WRONG file (the old root-level version). We need to revert that change and delete the file entirely. The `tools/xlsx-extract/Makefile` (commit `b878c31`) is a separate file and unaffected.

- [ ] **Step 1: Restore the root skill file to its state before the bad commit**

```bash
cd /Users/srackhalllu/Desktop/资源管理器/safe/吕浩南
# Show the file content from parent commit (before 7c0565a) to verify we have it
git show 7c0565a~1:.claude/skills/generate-cli.md | tail -10
```

Expected: Last 10 lines are the original ending (no "Build: Makefile" section).

- [ ] **Step 2: Checkout the file from the parent commit to undo our changes**

```bash
git checkout 7c0565a~1 -- .claude/skills/generate-cli.md
```

- [ ] **Step 3: Verify the file is restored to pre-Makefile state**

```bash
grep -c "Build: Makefile" .claude/skills/generate-cli.md
```

Expected: `0` (the Makefile section is gone).

- [ ] **Step 4: Commit the reversion**

```bash
git add .claude/skills/generate-cli.md
git commit -m "revert: remove mistakenly appended Makefile section from old skill"
```

- [ ] **Step 5: Delete the old skill file**

```bash
git rm .claude/skills/generate-cli.md
git commit -m "chore: remove stale root-level generate-cli skill (superseded by tauri version)"
```

---

### Task 2: Append Makefile section to canonical tauri skill

**Files:**
- Modify: `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` (append at end)

- [ ] **Step 1: Read the last 5 lines of the canonical skill to know where to append**

```bash
tail -5 cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```

- [ ] **Step 2: Append the "Build: Makefile" section**

Append the following content to `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`:

```markdown

## Build: Makefile

After generating `main.go`, also create a `Makefile` in the same directory. Set the `BINARY` variable to the tool name (same as the `-o` flag in `go build`).

### Makefile Template

```makefile
BINARY  = <tool-name>

TARGETS = darwin-amd64 darwin-arm64 linux-amd64 linux-arm64 windows-amd64 windows-arm64

# make build — compile for current platform, output to current directory
.PHONY: build
build:
	go build -o $(BINARY) .

# make build-all — cross-compile all 6 platforms to bin/<os>-<arch>/
.PHONY: build-all
build-all:
	@for t in $(TARGETS); do \
		os=$$(echo $$t | cut -d- -f1); \
		arch=$$(echo $$t | cut -d- -f2); \
		out="bin/$$t/$(BINARY)"; \
		[ "$$os" = "windows" ] && out="$$out.exe"; \
		echo "→ $$t"; \
		GOOS=$$os GOARCH=$$arch CGO_ENABLED=0 go build -o "$$out" . ; \
	done

# make clean — remove bin/ and local binary
.PHONY: clean
clean:
	rm -rf bin $(BINARY)
```

### Instructions

1. Replace `<tool-name>` with the actual tool name (e.g., `xlsx-extract`, `json-formatter`)
2. Write this file as `Makefile` in the same directory as `main.go`
3. After writing, run `make build` to verify compilation succeeds
4. Run `make build-all` to verify all 6 cross-compile targets produce output
5. Report both `main.go` and `Makefile` as deliverables

### Key Design Points

| Element | Purpose |
|---------|--------|
| `CGO_ENABLED=0` | Static linking — no glibc dependency, works on any Linux |
| `.PHONY` on every target | Prevents name conflicts with files |
| `BINARY` variable at top | One-line rename for new tools |
| `bin/<os>-<arch>/` output | Predictable machine-parseable paths |
| Windows `.exe` conditional | Standard Windows PE convention |
```

- [ ] **Step 3: Verify the new section is present**

```bash
grep -c "Build: Makefile" cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```

Expected: `1`

- [ ] **Step 4: Verify no duplicate section**

```bash
grep -c "Build: Makefile" cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```

Expected: `1`

- [ ] **Step 5: Commit**

```bash
git add cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
git commit -m "feat(skill): add Makefile generation section to canonical generate-cli skill"
```

---

### Task 3: Create directory symlink for agent discovery

**Files:**
- Create: `项目根/.claude/skills/generate-cli` (symlink directory)

- [ ] **Step 1: Ensure the target directory exists**

```bash
ls -d cli-hub-tauri/.claude/skills/generate-cli
```

Expected: `cli-hub-tauri/.claude/skills/generate-cli`

- [ ] **Step 2: Create the symlink**

```bash
cd /Users/srackhalllu/Desktop/资源管理器/safe/吕浩南/.claude/skills
ln -s ../../cli-hub-tauri/.claude/skills/generate-cli generate-cli
```

- [ ] **Step 3: Verify the symlink resolves correctly**

```bash
ls -la .claude/skills/generate-cli
```

Expected: `generate-cli -> ../../cli-hub-tauri/.claude/skills/generate-cli`

- [ ] **Step 4: Verify SKILL.md is readable through the symlink**

```bash
head -5 .claude/skills/generate-cli/SKILL.md
```

Expected: Frontmatter from the canonical skill file.

- [ ] **Step 5: Verify the Makefile section is accessible through symlink**

```bash
grep -c "Build: Makefile" .claude/skills/generate-cli/SKILL.md
```

Expected: `1`

- [ ] **Step 6: Commit the symlink**

```bash
cd /Users/srackhalllu/Desktop/资源管理器/safe/吕浩南
git add .claude/skills/generate-cli
git commit -m "feat: add symlink from root skills to tauri generate-cli skill"
```

- [ ] **Step 7: Verify git stored it as a symlink (not a regular file)**

```bash
git ls-tree HEAD .claude/skills/generate-cli
```

Expected: mode `120000` (symlink), content shows the target path.

---

### Task 4: Final verification

**Files:**
- Verify: `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`
- Verify: `项目根/.claude/skills/generate-cli` (symlink)

- [ ] **Step 1: Confirm old flat file is gone**

```bash
ls .claude/skills/generate-cli.md 2>&1
```

Expected: `No such file or directory`

- [ ] **Step 2: Confirm symlink directory exists and has SKILL.md**

```bash
ls .claude/skills/generate-cli/SKILL.md
```

Expected: `.claude/skills/generate-cli/SKILL.md`

- [ ] **Step 3: Confirm canonical skill has all sections**

```bash
grep "^## " cli-hub-tauri/.claude/skills/generate-cli/SKILL.md
```

Expected: Original sections + `## Build: Makefile`

- [ ] **Step 4: Run git log to verify clean history**

```bash
git log --oneline -6
```

Expected (top to bottom): symlink commit → skill upgrade commit → delete commit → revert commit → Makefile commit → ...

---

## Completion Checklist

- [ ] `项目根/.claude/skills/generate-cli.md` no longer exists (old flat file deleted)
- [ ] `项目根/.claude/skills/generate-cli` is a symlink resolving to `cli-hub-tauri/.claude/skills/generate-cli`
- [ ] `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` contains the "Build: Makefile" section
- [ ] `项目根/.claude/skills/generate-cli/SKILL.md` reads the same content (through symlink)
- [ ] Git stores the symlink with mode `120000`
- [ ] `tools/xlsx-extract/Makefile` still exists and is unaffected
