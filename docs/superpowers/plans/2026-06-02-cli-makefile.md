# CLI Makefile Cross-Compile + generate-cli Skill Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Go-native Makefile for cross-platform builds to xlsx-extract and upgrade the generate-cli skill to auto-produce Makefiles for new tools.

**Architecture:** Two isolated changes — (1) a standalone Makefile in `tools/xlsx-extract/` driven by GOOS/GOARCH env vars, (2) a new appendix section in `.claude/skills/generate-cli.md` that instructs the agent to write a parameterized Makefile alongside generated main.go.

**Tech Stack:** GNU Make, Go 1.26 (GOOS/GOARCH cross-compilation), POSIX shell

---

### Task 1: Create Makefile for xlsx-extract

**Files:**
- Create: `tools/xlsx-extract/Makefile`

- [ ] **Step 1: Write the Makefile**

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

- [ ] **Step 2: Commit**

```bash
git add tools/xlsx-extract/Makefile
git commit -m "feat(xlsx-extract): add Makefile with 6-platform cross-compile support"
```

---

### Task 2: Verify Makefile works

**Files:**
- Verify: `tools/xlsx-extract/Makefile`

- [ ] **Step 1: Test `make build` (current platform)**

```bash
cd tools/xlsx-extract
make build
```

Expected: compiles successfully, produces `xlsx-extract` binary in `tools/xlsx-extract/`.

- [ ] **Step 2: Verify the binary runs**

```bash
cd tools/xlsx-extract
./xlsx-extract --version
```

Expected: `xlsx-extract v1.0.0 (protocol v1)`

- [ ] **Step 3: Test `make build-all` (cross-compile)**

```bash
cd tools/xlsx-extract
make build-all
```

Expected: 6 platform lines printed, produces:
```
bin/darwin-amd64/xlsx-extract
bin/darwin-arm64/xlsx-extract
bin/linux-amd64/xlsx-extract
bin/linux-arm64/xlsx-extract
bin/windows-amd64/xlsx-extract.exe
bin/windows-arm64/xlsx-extract.exe
```

- [ ] **Step 4: Verify output directory structure**

```bash
cd tools/xlsx-extract
ls -la bin/*/xlsx-extract* 2>/dev/null | wc -l
```

Expected: `6` (six binaries total, Windows ones with `.exe`)

- [ ] **Step 5: Test `make clean`**

```bash
cd tools/xlsx-extract
make clean
```

Expected: `bin/` directory and local `xlsx-extract` binary are removed.

- [ ] **Step 6: Verify clean state**

```bash
cd tools/xlsx-extract
ls bin/ 2>&1   # should error: "No such file or directory"
ls xlsx-extract 2>&1  # should error: "No such file or directory"
```

- [ ] **Step 7: Commit (if verification passes)**

```bash
# If any fixes were needed, commit them:
git add tools/xlsx-extract/Makefile
git commit --amend --no-edit
```

---

### Task 3: Upgrade generate-cli skill with Makefile section

**Files:**
- Modify: `.claude/skills/generate-cli.md` (append new section at end)

- [ ] **Step 1: Append the "Build: Makefile" section**

Append the following content to `.claude/skills/generate-cli.md`:

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

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/generate-cli.md
git commit -m "feat(skill): add Makefile generation section to generate-cli skill"
```

---

### Task 4: Verify skill generates correct Makefile

**Files:**
- Verify: `.claude/skills/generate-cli.md` (read to confirm new section is present)

- [ ] **Step 1: Confirm the new section exists in the skill file**

```bash
grep -c "Build: Makefile" .claude/skills/generate-cli.md
```

Expected: `1` (the heading appears exactly once)

- [ ] **Step 2: Confirm the Makefile template is complete**

```bash
grep -c "BINARY  =" .claude/skills/generate-cli.md
```

Expected: `1` (the BINARY variable placeholder appears in the template)

- [ ] **Step 3: Verify all 6 targets are present in the template**

```bash
grep "TARGETS =" .claude/skills/generate-cli.md
```

Expected: line contains `darwin-amd64 darwin-arm64 linux-amd64 linux-arm64 windows-amd64 windows-arm64`

- [ ] **Step 4: Confirm skill file still has all original sections intact**

```bash
grep "^## " .claude/skills/generate-cli.md
```

Expected: output includes original headings (e.g., `## Required Conventions`, `## Code Template`, `## Instructions`) plus the new `## Build: Makefile`.

- [ ] **Step 5: Commit (if any fixes)**

```bash
git add .claude/skills/generate-cli.md
git commit --amend --no-edit  # if verification needed fixes
```

---

## Completion Checklist

- [ ] `tools/xlsx-extract/Makefile` exists with `build`, `build-all`, `clean` targets
- [ ] `make build` compiles for current platform, binary runs successfully
- [ ] `make build-all` produces 6 binaries in `bin/<os>-<arch>/`, Windows ones with `.exe`
- [ ] `make clean` removes `bin/` and local binary
- [ ] `.claude/skills/generate-cli.md` has new "Build: Makefile" section with complete template
- [ ] All original skill sections remain intact
