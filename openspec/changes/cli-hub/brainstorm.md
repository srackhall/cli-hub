## Design Summary

Desktop app (Wails v3) that dynamically discovers Go CLI tools in a `tools/` directory, renders parameter forms from each CLI's `--schema` JSON Schema output, and executes them with real-time streaming output. Zero coupling between UI and individual CLIs. Ships with a generate-cli Skill for AI-assisted CLI creation that conforms to project conventions.

## Alternatives Considered

### 方案 A：Tauri (Rust backend)
- **做法**：Use Tauri v2 with Rust backend, React frontend
- **优点**：Smaller binary size, strong security model, mature ecosystem
- **缺点**：Team primarily writes Go; Rust learning curve; os/exec from Rust less ergonomic for Go CLI execution; Wails v3's pure-Go WebView approach eliminates CGO dependency
- **为何未采用**：Team Go expertise and the need to exec Go binaries natively favor Wails

### 方案 B：Electron
- **做法**：Node.js backend + Electron shell, execute CLIs via child_process
- **优点**：Largest ecosystem, most documentation, easiest frontend integration
- **缺点**：Heavy memory footprint (~150MB baseline), large bundle size, overkill for a utility app that just wraps CLI tools
- **为何未采用**：Resource overhead unacceptable for a thin CLI adapter; Wails produces ~10MB binaries

### 方案 C：Web app + REST API server
- **做法**：Go HTTP server wrapping CLIs, React SPA frontend, browser-based access
- **优点**：No desktop framework dependency, cross-platform by default, familiar web deployment model
- **缺点**：Requires server management, no native file dialogs, adds network latency between UI and CLI execution
- **为何未采用**：Target users need a double-click desktop experience; native file pickers are a hard requirement per design

## Agreed Approach

Wails v3 — Go WebView bindings, no CGO, direct `os/exec` for CLI integration. The Go backend and CLI tools share the same runtime, making parameter passing and output capture natural. Wails v3's typed bindings generator eliminates manual RPC wiring.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cross-platform desktop | Wails v3 | Pure Go, no CGO, native WebView per platform |
| Frontend framework | Vite + React + TypeScript | Fast HMR, type safety, ecosystem |
| UI components | shadcn/ui + Tailwind CSS v4 | Accessible, customizable, copy-paste model |
| CLI self-description | `--schema` JSON Schema | Industry standard, no extra config files needed |
| Multi-step forms | `x-steps` schema extension | Backend-free; pure frontend behavior |
| Real-time output | Wails Events (pub/sub) | Typed, supports multiple windows, built into framework |
| AI code generation | Claude Code Skill | Version-controlled with project, structured prompting |

## Open Questions

- None remaining — all design forks resolved, dependencies mapped, acceptance criteria defined
