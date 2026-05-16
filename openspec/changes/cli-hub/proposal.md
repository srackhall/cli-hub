## Why

The team maintains multiple Go CLI tools (xlsx processing, txt processing, data cleaning pipelines). Current users operate them via command line, but as the customer base expands, many customers are not comfortable with terminals. A desktop GUI adapter is needed that dynamically discovers CLI tools in a `tools/` directory, renders parameter forms from each tool's `--schema` JSON output, and executes them with real-time streaming output — all with zero coupling between the UI and individual CLIs.

## What Changes

**Tool Discovery**
- From: no UI for CLI tools
- To: Go backend scans `tools/` directory at startup, calls each CLI's `--schema` to extract parameter metadata, exposes typed API via Wails v3 bridge
- Impact: new capability, non-breaking

**Dynamic Parameter Forms**
- From: users must read CLI help text and construct commands manually
- To: React frontend renders forms dynamically from JSON Schema (supporting string, number, boolean, enum, array, file-path types), with optional multi-step wizard via `x-steps` extension
- Impact: new capability, non-breaking

**Real-time Execution Console**
- From: no visibility into long-running CLI operations
- To: stdout/stderr streamed in real-time via Wails Events, displayed in an embedded console panel with completion status
- Impact: new capability, non-breaking

## Capabilities

### New Capabilities
- `tool-discovery`: automatic scanning of `tools/` directory, parsing `--schema` output to build typed ToolInfo list
- `dynamic-form-rendering`: React component tree that renders JSON Schema parameters as shadcn/ui form controls
- `multi-step-wizard`: `x-steps` schema extension for step-by-step parameter configuration
- `cli-execution`: `os/exec`-based execution with goroutine-synchronized stdout/stderr streaming via Wails Events
- `ai-cli-generator`: generate-cli skill for AI-assisted creation of conformant CLI tools

## Impact

- New Go package: `cli-hub/` (backend + frontend)
- New frontend stack: Vite + React + TypeScript + shadcn/ui + Tailwind CSS v4
- Runtime dependency: Wails v3 (alpha) — Go module `v3.0.0-alpha.90`, npm `@wailsio/runtime` v3.0.0-alpha.79
- Tools directory convention: each subdirectory under `cli-hub/tools/` must be a standalone Go binary implementing `--schema` and `--version` flags
