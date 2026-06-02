# Design Spec: CLI Makefile + generate-cli Skill Upgrade + Skill File Consolidation

**Date:** 2026-06-02
**Status:** Proposed

## 1. Motivation

Two intertwined issues need resolution:

1. **No build automation** — `tools/xlsx-extract/` (the only CLI tool) has no Makefile for Go cross-compilation, despite Go's first-class GOOS/GOARCH support.

2. **Duplicate skill files** — The `generate-cli` skill exists in two places:
   - `项目根/.claude/skills/generate-cli.md` (358 lines, old flat-file version) — this is the one Claude Code **actually discovers** when working from the repo root.
   - `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` (517 lines, canonical two-section design) — this is the **authoritative version** but is invisible to agents because it's outside the workspace root's `.claude/skills/`.

   The old spec (2026-05-30) planned to delete the old version but this was never completed. We need to consolidate to a single source of truth and add Makefile generation capability.

## 2. Scope

**In scope:**
- Create `tools/xlsx-extract/Makefile` with 3 targets: `build`, `build-all`, `clean`
- 6 cross-compile targets: darwin/amd64, darwin/arm64, linux/amd64, linux/arm64, windows/amd64, windows/arm64
- Output structure: `bin/<os>-<arch>/<tool>[.exe]` for cross-compile; current directory for `build`
- Append a "Build: Makefile" section to the **canonical** skill at `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`
- Delete `项目根/.claude/skills/generate-cli.md` (old flat file)
- Create a **directory symlink**: `项目根/.claude/skills/generate-cli` → `cli-hub-tauri/.claude/skills/generate-cli`

**Out of scope:**
- CI/CD pipeline changes
- Signing/notarization of binaries
- Non-Go CLI tools

## 3. Design

### 3.1 `tools/xlsx-extract/Makefile`

```makefile
BINARY  = xlsx-extract

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

**Key decisions:**

| Decision | Rationale |
|----------|----------|
| `CGO_ENABLED=0` | Static linking — no glibc dependency, portable across Linux distros |
| `.PHONY` on every target | Prevents conflicts if a file named `build`/`clean` exists |
| `BINARY` variable at top | One-line rename to reuse for future tools |
| `bin/<os>-<arch>/` output | Predictable, machine-parseable; follows Go conventions |
| Windows `.exe` suffix conditional | Pure POSIX sh `[ ]` test, no Makefile extensions needed |

### 3.2 Skill Upgrade: "Build: Makefile" Section

Append to `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` a new section instructing the agent to auto-generate a Makefile alongside `main.go`. The section includes:

1. The full Makefile template (parameterized with `<tool-name>` placeholder)
2. Instructions: replace `<tool-name>`, write as `Makefile`, verify with `make build` and `make build-all`
3. Key design points table explaining `CGO_ENABLED=0`, `.PHONY`, etc.

### 3.3 Skill File Consolidation

**Before:**
```
项目根/.claude/skills/
  generate-cli.md              ← OLD (358 lines), wrongly updated with Makefile
  openspec-*/                  ← other skills

cli-hub-tauri/.claude/skills/
  generate-cli/
    SKILL.md                   ← CANONICAL (517 lines), invisible to agent
```

**After:**
```
项目根/.claude/skills/
  generate-cli/                → symlink → ../../cli-hub-tauri/.claude/skills/generate-cli
  openspec-*/                  ← other skills (unchanged)

cli-hub-tauri/.claude/skills/
  generate-cli/
    SKILL.md                   ← CANONICAL (with new Makefile section), single source of truth
```

**Why directory symlink:** Matches the canonical directory structure exactly (`skills/generate-cli/SKILL.md`). The agent discovers skills by scanning `项目根/.claude/skills/` directories — a symlink directory is transparent and followed. All maintenance happens in `cli-hub-tauri/`, the symlink ensures agents always read the latest version.

## 4. Implementation Steps (Ordered)

1. Revert the Makefile append on `项目根/.claude/skills/generate-cli.md` (undo bad commit)
2. Delete `项目根/.claude/skills/generate-cli.md`
3. Append "Build: Makefile" section to `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md`
4. Create symlink: `项目根/.claude/skills/generate-cli` → `../../cli-hub-tauri/.claude/skills/generate-cli`
5. Verify: `make build` / `make build-all` / `make clean` work in `tools/xlsx-extract/`

## 5. Verification

- [ ] `make build` in `tools/xlsx-extract/` produces a working binary
- [ ] `make build-all` produces 6 binaries in correct `bin/<os>-<arch>/` directories
- [ ] `make clean` removes `bin/` and local binary
- [ ] `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` contains the Makefile section
- [ ] `项目根/.claude/skills/generate-cli/SKILL.md` resolves to the tauri version (symlink works)
- [ ] The old `项目根/.claude/skills/generate-cli.md` flat file is deleted

## 6. Risks

| Risk | Mitigation |
|------|----------|
| Symlink breaks on Windows | This is a macOS dev environment; symlinks are natively supported. If Windows support is needed later, switch to a copy script. |
| Git stores symlink as text | Git on macOS stores symlinks natively. Verify with `git ls-tree` after commit. |
