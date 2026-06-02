# Design Spec: CLI Tool Makefile + generate-cli Skill Upgrade

**Date:** 2026-06-02
**Status:** Proposed

## 1. Motivation

The `tools/` directory houses CLI tools (currently only `xlsx-extract`) that need to be distributed as cross-platform binaries for the CLI Hub Tauri desktop app. Go has first-class cross-compilation support via `GOOS`/`GOARCH` environment variables, but there is no build automation — no Makefile exists anywhere in the project. Additionally, the `generate-cli` skill that scaffolds new CLI tools needs to auto-generate a Makefile alongside the Go source.

## 2. Scope

**In scope:**
- Create `tools/xlsx-extract/Makefile` with 3 targets: `build`, `build-all`, `clean`
- 6 cross-compile targets: darwin/amd64, darwin/arm64, linux/amd64, linux/arm64, windows/amd64, windows/arm64
- Output structure: `bin/<os>-<arch>/<tool>[.exe]` for cross-compile; current directory for `build`
- Upgrade `.claude/skills/generate-cli.md` — add a "Build: Makefile" section so new tools get a Makefile automatically

**Out of scope:**
- CI/CD pipeline changes (GitHub Actions already handles builds)
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

**Design decisions:**

| Decision | Rationale |
|----------|----------|
| `CGO_ENABLED=0` | Produces statically-linked binaries with no glibc dependency — essential for "works anywhere" distribution |
| `.PHONY` on every target | Prevents conflicts if a file named `build`/`clean` happens to exist |
| `BINARY` variable at top | One-line change to reuse the Makefile for other tools |
| `bin/<os>-<arch>/` output | Predictable, machine-parseable path; matches Go conventions |
| Windows `.exe` suffix conditional | Standard Windows convention; `[ "$$os" = "windows" ]` is pure POSIX sh, no Makefile extensions needed |
| No `go test`/`go run` targets | Not needed — `go test` is one command, `go run .` is one command. Keep Makefile minimal. |

### 3.2 Skill Upgrade: `.claude/skills/generate-cli.md`

Append a new section at the end of the existing skill file:

#### "Build: Makefile" Section

This section instructs the agent (Claude Code reading the skill) to:

1. After generating `main.go`, also create a `Makefile` in the same directory
2. Set `BINARY` to the tool name (same as what `go build -o <name>` would use)
3. Use the canonical template (same as 3.1)
4. Verify `make build` succeeds before reporting completion

The section includes the full Makefile template (parameterized with `$(BINARY)`) so the agent can write it verbatim with only the `BINARY` variable customized.

### 3.3 Directory Layout After Change

```
tools/xlsx-extract/
  Makefile          ← NEW
  main.go
  go.mod
  go.sum
  test.sh
  bin/              ← NEW (after make build-all)
    darwin-amd64/
      xlsx-extract
    darwin-arm64/
      xlsx-extract
    linux-amd64/
      xlsx-extract
    linux-arm64/
      xlsx-extract
    windows-amd64/
      xlsx-extract.exe
    windows-arm64/
      xlsx-extract.exe

.claude/skills/
  generate-cli.md   ← MODIFIED (new section appended)
```

## 4. Verification

- [ ] `make build` in `tools/xlsx-extract/` produces a working binary in the current directory
- [ ] `make build-all` produces 6 binaries in correct `bin/<os>-<arch>/` directories, Windows ones with `.exe`
- [ ] `make clean` removes `bin/` and the local binary
- [ ] Running `/generate-cli` with a test tool name produces both `main.go` and `Makefile`
- [ ] The generated Makefile's `make build` succeeds for the test tool

## 5. Risks

| Risk | Mitigation |
|------|----------|
| `cut -d- -f1` fails on macOS if TARGETS naming convention changes | Document the `<os>-<arch>` naming contract in Makefile comments |
| Future tools may have different `go.mod` modules | Makefile is per-tool; each tool's `Makefile` runs in its own directory with its own `go.mod` |
