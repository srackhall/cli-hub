# Design Spec: generate-cli Skill (Tauri Version)

**Date:** 2026-05-30
**Status:** Proposed

## 1. Motivation

The current `generate-cli` skill at `cli-hub/.claude/skills/generate-cli/SKILL.md` was created when `cli-hub/` was the primary project. Now the focus has shifted to `cli-hub-tauri/`, and a new version of the skill is needed with:

- Chinese-first design philosophy for the Tauri desktop client's UI
- Self-contained structure that works both as a Claude Code skill and as a copy-paste prompt for web-based LLMs
- Go language remains the default for generated CLI tools
- Unified replacement of the old skill (no dual maintenance)

## 2. Scope

**In scope:**
- Create `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` — single self-contained file
- Two-section structure: Section A (Agent instructions) + Section B (User copy-paste prompt)
- Chinese-first schema conventions (Chinese descriptions optimized for non-technical UI users)
- Go template with zero external dependencies (`flag` package)
- Full CLI Hub protocol compliance (`--schema`, `--version`, exit codes, x-steps)

**Out of scope:**
- Changing the bilingual field structure (`title`/`titleZh`, etc.) — stays as-is
- Frontend i18n switching — deferred to future discussion
- Multi-language CLI generation (only Go for now)
- MSI/NSIS installer or build pipeline changes

## 3. File Architecture

```
cli-hub-tauri/
  .claude/
    skills/
      generate-cli/
        SKILL.md          <-- NEW (replaces cli-hub/.claude/skills/generate-cli/SKILL.md)

cli-hub/
  .claude/
    skills/
      generate-cli/       <-- DELETED after new skill is deployed and verified
        SKILL.md
```

## 4. SKILL.md Structure (Two-Section Design)

### 4.1 Frontmatter

```yaml
---
name: generate-cli
description: Generate Go CLI tools that comply with CLI Hub Tauri interface specification (--schema, --version, exit codes, x-steps), with Chinese-first UI design
---
```

### 4.2 Section A — Agent Instructions (Claude Code)

Target audience: Claude Code Agent reading this skill via the `Skill` tool.

The agent, upon reading this section, should autonomously:
1. Understand the protocol spec
2. Generate a complete `main.go` file
3. Compile with `go build -o <name> .`
4. Verify `--schema` and `--version` work
5. Report completion — done. No manual user steps needed.

Contents:

**A1. Overview** — What CLI Hub Tauri is, and the skill's purpose.

**A2. Protocol Specification:**
- `--schema` (required): Output valid JSON Schema with bilingual fields
- `--version` (recommended): `<name> v<semver> (protocol v1)`
- Exit code convention: 0=success, 1=param error, 2=runtime error
- Output convention: stdout for progress + JSON last line, stderr for errors

**A3. Bilingual Schema Fields (Chinese-First):**

| Field | Language | Purpose |
|-------|----------|---------|
| `title` | English | Tool name in sidebar |
| `titleZh` | Chinese | **Primary** display name in UI |
| `description` | English | One-line summary |
| `descriptionZh` | Chinese | **Primary** one-line summary in UI |
| `longDescription` | English | Detailed docs |
| `longDescriptionZh` | Chinese | **Primary** detailed docs in UI |
| Property `description` | English | Form field label |
| Property `descriptionZh` | Chinese | **Primary** form field label |
| x-steps `title` | English | Wizard step name |
| x-steps `titleZh` | Chinese | **Primary** wizard step name |

**Design principle:** Chinese fields (`*Zh`) are the primary display language for the Tauri client UI. English fields are fallbacks and serve technical accuracy. Write Chinese descriptions with non-technical end users in mind — they will read these labels in a visual form.

**A4. Type → UI Component Mapping** (same as existing)

**A5. Multi-step Support (x-steps)** (same as existing)

**A6. Go Template** — Full `main.go` template using `flag` package, zero external dependencies. Template includes Chinese-first example data.

### 4.3 Section B — User Copy-Paste Prompt

Target audience: A user who copies this entire section and pastes it into a web-based LLM (ChatGPT, Claude.ai, etc.).

This section MUST be fully self-contained — the web LLM has no access to the Claude Code skill system, no project context, and no filesystem.

Contents (all in one markdown block, clearly demarcated):

1. **Role instruction:** "You are an expert Go developer building CLI tools for CLI Hub Tauri..."
2. **Protocol spec** (same as Section A, but written as instructions to the LLM)
3. **Bilingual schema rules** (same as A3)
4. **Go template** (same as A6)
5. **Manual operation steps for the user:**
   - Step 1: Copy the generated code, save as `main.go`
   - Step 2: Run `go build -o <tool-name> .`
   - Step 3: In CLI Hub Tauri, click "导入" and select the compiled binary
   - Step 4: Verify the tool appears in sidebar and `--schema` / `--version` work

The Section B block is explicitly marked with a comment boundary like:
```
<!-- COPY BELOW TO WEB LLM -->
... (entire self-contained prompt) ...
<!-- END COPY -->
```

## 5. Key Design Decisions

| Decision | Rationale |
|----------|----------|
| Single SKILL.md, two sections | Avoids fragmenting the source of truth. One file to maintain. |
| Section A vs B separation | Different audiences: Agent needs minimal instruction, user prompt needs full self-containment + manual steps. |
| Chinese-first but bilingual | Frontend already uses `*Zh || english` fallback. No schema changes needed. Skill just emphasizes writing better Chinese descriptions. |
| Replace old skill entirely | Avoids dual maintenance burden. Old `cli-hub/` skill is superseded. |
| Zero external Go dependencies | `flag` package is stdlib. Users can compile without `go mod init`. Maximizes portability. |
| HTML comment boundary for Section B | Simple, works in any text editor, visible but not disruptive in markdown rendering. |

## 6. Migration Plan

1. Create `cli-hub-tauri/.claude/skills/generate-cli/SKILL.md` with the new content.
2. Verify the new skill works in Claude Code (`/generate-cli`).
3. Verify Section B works by pasting it into a web LLM and validating the output.
4. Delete `cli-hub/.claude/skills/generate-cli/SKILL.md`.
5. Commit and push.

## 7. Success Criteria

- [ ] `/generate-cli` in Claude Code produces a complete Go `main.go` that compiles and outputs valid `--schema`
- [ ] Section B, when pasted into a web LLM, produces a complete Go file + manual operation steps
- [ ] Generated schema has well-written `titleZh`, `descriptionZh`, `longDescriptionZh` suitable for non-technical Chinese users
- [ ] Generated CLI binary can be imported into CLI Hub Tauri and displays correctly in the UI
- [ ] Old skill file is deleted

## 8. Open Questions

- **Frontend i18n switching** — Deferred. User will revisit whether the Tauri client needs a language toggle. Current design assumes Chinese is always the primary UI language.
- **Non-Go language support** — Deferred. Go is the only supported language for now. The skill structure does not preclude future language additions.
