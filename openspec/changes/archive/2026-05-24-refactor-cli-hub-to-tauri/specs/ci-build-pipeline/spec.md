## ADDED Requirements

### Requirement: macOS arm64 CI build
The system SHALL build a macOS arm64 `.app` bundle via GitHub Actions on every push to main and pull request.

#### Scenario: Push to main triggers build
- **WHEN** code is pushed to the main branch
- **THEN** the macOS build job SHALL run on `macos-latest`, install Node 22 and Rust stable, run `npm ci`, and execute `tauri-apps/tauri-action@v0` with `--target aarch64-apple-darwin --bundles app`

#### Scenario: PR triggers build
- **WHEN** a pull request targets the main branch
- **THEN** the macOS build job SHALL run with the same configuration as push builds

#### Scenario: Build artifact upload
- **WHEN** the macOS build succeeds
- **THEN** the `.app` bundle SHALL be uploaded as a GitHub Actions artifact named `cli-hub-tauri-macos-arm64`

### Requirement: Windows amd64 CI build
The system SHALL build a Windows amd64 `.msi` installer via GitHub Actions on every push to main and pull request.

#### Scenario: Push to main triggers build
- **WHEN** code is pushed to the main branch
- **THEN** the Windows build job SHALL run on `windows-latest`, install Node 22 and Rust stable, run `npm ci`, and execute `tauri-apps/tauri-action@v0` with `--target x86_64-pc-windows-msvc --bundles msi`

#### Scenario: Build artifact upload
- **WHEN** the Windows build succeeds
- **THEN** the `.msi` installer SHALL be uploaded as a GitHub Actions artifact named `cli-hub-tauri-windows-amd64`

### Requirement: Manual workflow dispatch
The CI workflow SHALL support `workflow_dispatch` for manual triggering from the GitHub Actions UI.

#### Scenario: Manual trigger
- **WHEN** a user manually triggers the workflow from the Actions tab
- **THEN** both macOS and Windows build jobs SHALL run

### Requirement: Explicit tauriScript configuration
The CI workflow SHALL use `tauriScript: npx tauri` in the tauri-action configuration to ensure the correct Tauri CLI version is used.

#### Scenario: Build with specified CLI
- **WHEN** tauri-action runs
- **THEN** it SHALL invoke `npx tauri` rather than a globally installed or auto-detected Tauri CLI

### Requirement: Build-only artifacts (no DMG/NSIS)
The CI workflow SHALL produce `.app` on macOS and `.msi` on Windows as the only build artifacts, avoiding DMG and NSIS/EXE packaging issues in CI environments.

#### Scenario: macOS artifact format
- **WHEN** macOS build completes
- **THEN** the artifact SHALL contain only `.app` bundle, not `.dmg`

#### Scenario: Windows artifact format
- **WHEN** Windows build completes
- **THEN** the artifact SHALL contain only `.msi` installer

### Requirement: Correct frontend build before Tauri bundling
The CI workflow SHALL install frontend dependencies with `npm ci` in the `cli-hub-tauri` directory before invoking tauri-action.

#### Scenario: Frontend dependency installation
- **WHEN** CI runs the build job
- **THEN** `npm ci` SHALL execute in the `cli-hub-tauri` working directory, using the lockfile for deterministic installs
