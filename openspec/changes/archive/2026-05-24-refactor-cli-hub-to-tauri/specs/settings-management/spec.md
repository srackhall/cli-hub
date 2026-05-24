## ADDED Requirements

### Requirement: Settings persistence
The system SHALL persist application settings as a JSON file at `db/settings.json` relative to the app's resource directory.

#### Scenario: First launch
- **WHEN** the app launches for the first time and no settings file exists
- **THEN** the system SHALL create default settings and persist them to disk

#### Scenario: Save settings
- **WHEN** user modifies any setting and clicks save
- **THEN** the system SHALL atomically update the in-memory settings and write the full JSON to disk

#### Scenario: Load settings on startup
- **WHEN** the app launches
- **THEN** the system SHALL load settings from `db/settings.json` into memory, falling back to defaults if the file is missing or corrupted

### Requirement: Thread-safe settings access
The system SHALL use `RwLock<AppSettings>` to allow concurrent reads from multiple Tauri command handlers.

#### Scenario: Concurrent read access
- **WHEN** multiple Tauri commands read settings simultaneously
- **THEN** all reads SHALL complete without blocking each other

#### Scenario: Write blocks reads
- **WHEN** a write operation holds the lock
- **THEN** read operations SHALL wait until the write completes, ensuring no stale data is returned

### Requirement: Configurable tools directory
The system SHALL allow the user to configure a custom tools directory path through the settings UI, using a native folder picker dialog.

#### Scenario: Change tools directory
- **WHEN** user opens settings, clicks the folder picker for tools directory, and selects a new folder
- **THEN** the system SHALL update the tools directory path, persist it, and refresh the tool list from the new directory

#### Scenario: Native folder dialog
- **WHEN** user clicks the folder picker button
- **THEN** the system SHALL open a native OS folder selection dialog via `@tauri-apps/plugin-dialog`

### Requirement: Theme persistence
The system SHALL support dark and light themes with the user's choice persisted in settings.

#### Scenario: Toggle theme
- **WHEN** user switches between dark and light theme
- **THEN** the UI SHALL immediately reflect the change via CSS class toggle, and the choice SHALL be persisted

#### Scenario: Theme survives restart
- **WHEN** the app restarts
- **THEN** the previously selected theme SHALL be restored from persisted settings

### Requirement: File-based logging
The system SHALL persist application logs to a rotating file in the app's log directory.

#### Scenario: App produces logs
- **WHEN** the app runs and performs operations
- **THEN** log entries SHALL be written to a timestamped log file with tracing metadata (level, target, span)

#### Scenario: Log rotation
- **WHEN** the log file exceeds a configured size limit
- **THEN** the system SHALL rotate to a new log file, keeping a reasonable number of historical files
