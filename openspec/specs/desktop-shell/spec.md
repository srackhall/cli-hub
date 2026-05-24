## ADDED Requirements

### Requirement: macOS overlay title bar
The system SHALL use `titleBarStyle: "Overlay"` with `hiddenTitle: true` on macOS to provide a native frosted-glass title bar appearance.

#### Scenario: macOS window appearance
- **WHEN** the app launches on macOS
- **THEN** the window SHALL have a transparent title bar overlay with window controls overlaid on the content area

### Requirement: Window drag and drop
The system SHALL accept file and folder drops via the Tauri native `tauri://drag-drop` event.

#### Scenario: File dropped on window
- **WHEN** a file is dragged and dropped onto the app window
- **THEN** the system SHALL resolve the file path and populate the active file input field

#### Scenario: Drag over window
- **WHEN** a file is being dragged over the app window
- **THEN** the active input field SHALL receive focus to indicate it can accept the drop

### Requirement: Minimum window constraints
The system SHALL enforce minimum window dimensions of 700x480 pixels and default to 960x680, centered on screen.

#### Scenario: Window resize attempt below minimum
- **WHEN** user attempts to resize the window below 700x480
- **THEN** the window SHALL not shrink below the minimum dimensions

### Requirement: Content Security Policy
The system SHALL enforce a CSP that allows self-origin resources, unsafe-inline scripts/styles, data: images and fonts.

#### Scenario: External script blocked
- **WHEN** the app attempts to load a script from an external origin
- **THEN** the WebView SHALL block the script per the CSP directive

### Requirement: Shell open capability
The system SHALL allow opening external URLs in the system default browser via the Tauri shell plugin.

#### Scenario: Open external URL
- **WHEN** the app invokes the shell open command with a valid URL
- **THEN** the system default browser SHALL open with that URL

### Requirement: Native dialog integration
The system SHALL use `@tauri-apps/plugin-dialog` for file open, folder selection, and confirmation dialogs, providing native OS dialog windows.

#### Scenario: File open dialog
- **WHEN** user triggers a file selection action
- **THEN** a native file open dialog SHALL appear, and the selected path SHALL be returned to the calling component

#### Scenario: Folder selection dialog
- **WHEN** user triggers a folder selection action
- **THEN** a native folder selection dialog SHALL appear
