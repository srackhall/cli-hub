## ADDED Requirements

### Requirement: Tool script CRUD management
The system SHALL allow users to create, read, update, and delete tool scripts stored in a configurable tools directory.

#### Scenario: List all tools
- **WHEN** user opens the app and the tools directory exists
- **THEN** the sidebar SHALL display all executable files from the tools directory, with their names and metadata

#### Scenario: Create a new tool
- **WHEN** user clicks "新建工具" and fills in name, description, and script content
- **THEN** the system SHALL create a new executable file in the tools directory and refresh the tool list

#### Scenario: Edit an existing tool
- **WHEN** user selects a tool and modifies its script content or metadata
- **THEN** the system SHALL update the tool file and preserve its executable permissions

#### Scenario: Delete a tool
- **WHEN** user deletes a tool from the list
- **THEN** the system SHALL remove the corresponding file from the tools directory after confirmation

#### Scenario: Tools directory does not exist
- **WHEN** the configured tools directory path does not exist
- **THEN** the system SHALL display an empty tool list and show a prompt to configure the directory in settings

### Requirement: Async streaming tool execution
The system SHALL execute tool scripts asynchronously and stream stdout/stderr output to the frontend in real time.

#### Scenario: Successful execution with output
- **WHEN** user clicks "执行" for a tool with valid parameters
- **THEN** the system SHALL launch the tool as a subprocess, emit each stdout/stderr line as a "tool-output" event, and report "执行完成" when the process exits with code 0

#### Scenario: Execution timeout
- **WHEN** a tool runs for more than 300 seconds
- **THEN** the system SHALL kill the subprocess and report "执行超时 (超过 5 分钟)"

#### Scenario: Tool returns error code
- **WHEN** a tool exits with non-zero code
- **THEN** the system SHALL report the error with the exit code and appropriate message (code 1 = "参数错误", others = "运行时错误")

#### Scenario: Invalid tool name
- **WHEN** user attempts to execute a tool with name containing path separators (/ \\) or special values (. ..)
- **THEN** the system SHALL reject the execution with "invalid tool name" error

#### Scenario: Tool not found
- **WHEN** user attempts to execute a tool that does not exist on disk
- **THEN** the system SHALL return "tool not found" error

### Requirement: Parameter building with security filtering
The system SHALL convert a key-value parameter map to CLI arguments with security filtering on parameter keys.

#### Scenario: Boolean flag parameter
- **WHEN** a parameter value is boolean true
- **THEN** the system SHALL emit `--key` as a flag without a value

#### Scenario: String parameter
- **WHEN** a parameter value is a non-empty string
- **THEN** the system SHALL emit `--key value` as two separate arguments

#### Scenario: Array parameter
- **WHEN** a parameter value is an array of strings
- **THEN** the system SHALL emit `--key item1 --key item2` for each array element

#### Scenario: Numeric parameter
- **WHEN** a parameter value is a number
- **THEN** the system SHALL emit `--key 123` as two separate arguments with the string representation

#### Scenario: Malicious key rejected
- **WHEN** a parameter key contains characters outside [a-zA-Z0-9.-]
- **THEN** the system SHALL skip that parameter entirely

### Requirement: Windows console window suppression
On Windows, the system SHALL create subprocesses with CREATE_NO_WINDOW flag to prevent console windows from popping up during tool execution.

#### Scenario: Tool execution on Windows
- **WHEN** a tool is executed on Windows
- **THEN** no console window SHALL appear; output SHALL still be captured and streamed to the frontend

### Requirement: Concurrent streaming of stdout and stderr
The system SHALL read stdout and stderr concurrently from the subprocess and emit each line as a separate frontend event.

#### Scenario: Mixed stdout and stderr output
- **WHEN** a tool produces both stdout and stderr output
- **THEN** both streams SHALL be delivered to the frontend with correct stream labels ("stdout" or "stderr") in real time

#### Scenario: Large output
- **WHEN** a tool produces many lines of output
- **THEN** the frontend console SHALL display all lines without truncation, with auto-scroll to bottom
