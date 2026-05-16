## ADDED Requirements

### Requirement: Backend SHALL scan the tools directory at startup and report all discovered tools

The Go backend MUST list every subdirectory under `cli-hub/tools/` that contains an executable binary, call each binary with `--version` and `--schema` flags, and return a typed `ToolInfo` list to the frontend.

#### Scenario: Tool directory contains valid CLI binaries
- **WHEN** the app starts and `tools/` contains `xlsx-merge` (a valid CLI with `--schema` and `--version`)
- **THEN** `ListTools()` returns an array containing a `ToolInfo` entry with `name: "xlsx-merge"`, a non-empty `version`, and `ready: true`

#### Scenario: Tool binary fails --schema call
- **WHEN** a binary in `tools/` exists but `--schema` times out (30s) or returns invalid JSON
- **THEN** its `ToolInfo` entry has `ready: false` and a non-empty `error` field describing the failure

#### Scenario: Empty tools directory
- **WHEN** the `tools/` directory exists but contains no subdirectories with executables
- **THEN** `ListTools()` returns an empty array (not an error)

### Requirement: Tool name validation SHALL prevent path traversal attacks

#### Scenario: Malicious tool name with directory traversal
- **WHEN** `GetSchema` or `ExecuteTool` is called with a name containing `/`, `..`, or `\`
- **THEN** the backend rejects the request and returns an error without executing any process

#### Scenario: Valid tool name
- **WHEN** `GetSchema` is called with `name: "xlsx-merge"` (alphanumeric + hyphens only)
- **THEN** the backend accepts and executes `./tools/xlsx-merge --schema`
