## ADDED Requirements

### Requirement: Project SHALL provide a generate-cli skill for AI-assisted CLI creation

The project MUST include a Claude Code Skill file at `.claude/skills/generate-cli/` that encodes the project's CLI interface specification. When invoked by an AI agent, the Skill MUST produce a Go `main.go` that implements `--schema` (JSON Schema output), `--version`, and follows the standard exit code convention (0/1/2).

#### Scenario: Generating a new CLI tool from natural language
- **WHEN** a developer describes "I need a tool that merges CSV files by a common column" and invokes the generate-cli skill
- **THEN** the AI produces a standalone Go `main.go` file that:
  - Uses `flag` package for parameter handling
  - Implements `--schema` outputting valid JSON Schema with all parameters described
  - Implements `--version` outputting `<name> v<version> (protocol v1)`
  - Follows exit code 0/1/2 convention
  - Compiles to a standalone binary

#### Scenario: Schema output validates as proper JSON Schema
- **WHEN** the generated CLI is run with `--schema`
- **THEN** the output MUST be valid JSON that parses into a `ToolSchema` with at minimum `type`, `properties`, and `title` fields
