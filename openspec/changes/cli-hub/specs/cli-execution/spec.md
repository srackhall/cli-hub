## ADDED Requirements

### Requirement: Backend SHALL execute CLI tools with real-time output streaming

The Go backend MUST spawn the selected CLI tool as a subprocess via `os/exec`, capture stdout and stderr line-by-line via goroutines, and emit each line as a `tool-output` Wails event to the frontend in real time.

#### Scenario: Successful execution
- **WHEN** `ExecuteTool("xlsx-merge", {input: "a.xlsx"})` is called and the CLI exits with code 0
- **THEN** an `ExecuteResult` with `status: "ok"`, `code: 0`, and a non-empty `output` is returned
- **AND** stdout lines are emitted as `tool-output` events with `stream: "stdout"` during execution

#### Scenario: CLI exits with parameter error (code 1)
- **WHEN** the CLI exits with code 1
- **THEN** the `ExecuteResult` has `status: "error"`, `code: 1`, and the error output
- **AND** stderr lines are emitted as `tool-output` events with `stream: "stderr"` during execution

#### Scenario: CLI exits with runtime error (code 2)
- **WHEN** the CLI exits with code 2
- **THEN** the `ExecuteResult` has `status: "error"`, `code: 2`, and the error output

### Requirement: Goroutine synchronization SHALL prevent premature result return

#### Scenario: Output streaming completes before result returns
- **WHEN** stdout and stderr goroutines are still writing
- **THEN** the backend WaitGroup blocks the return until both goroutines finish

### Requirement: Frontend Console SHALL display real-time execution logs

#### Scenario: Receiving tool-output events
- **WHEN** the `tool-output` event fires with `{stream: "stdout", text: "Processing..."}`
- **THEN** the Console panel appends a log entry with the text, stream type, and timestamp
- **AND** stderr entries are visually distinguishable (e.g., red text)

#### Scenario: Execution completes
- **WHEN** `ExecuteTool` returns with code 0
- **THEN** the Console shows a final success entry and the Execute button becomes re-enabled
