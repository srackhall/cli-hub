# Settings: Simplify CLI Storage Path — Remove Custom Path, Add Open Directory Buttons

**Date:** 2026-05-31
**Status:** approved

## Goal

Remove the custom CLI storage path input from Settings. Use only the default app data directory. Add buttons to open the `cli/` and `db/` directories in the system file manager, and display the resolved absolute paths so users always know exactly where their files live.

## Motivation

1. **i18n describes behavior that doesn't exist** — `cliPathDesc` says "cli/ 子目录将自动创建", `dataNote` says "cli/../db/settings.json". Neither matches actual code.
2. **Settings UI shows user input, not resolved path** — users type `/my/path` and don't know where files actually end up.
3. **Custom path adds complexity for zero practical gain** — the default per-platform app data directory is the right place. Users just need to know where it is and be able to open it.

## Design

### Before

```
Settings
├── CLI 工具存储路径  [input: /custom/path]  [save button]
│   ├── "cli/ 目录将在指定路径创建"
│   └── "cli/../db/settings.json"
└── 界面语言  [dropdown]
```

### After

```
Settings
├── CLI 工具存储
│   ├── 说明: 工具存储在应用数据目录的 cli/ 子目录中
│   ├── 实际路径: ~/Library/Application Support/com.cli-hub.tauri/cli/
│   └── [📂 打开工具目录]
├── 设置与数据
│   ├── 说明: 应用设置和持久化数据存储在应用数据目录的 db/ 子目录中
│   ├── 实际路径: ~/Library/Application Support/com.cli-hub.tauri/db/
│   └── [📂 打开设置目录]
└── 界面语言  [dropdown]
```

### Platform paths (unchanged, now explicitly shown)

| Platform | Tools dir | Data dir |
|----------|-----------|----------|
| macOS | `~/Library/Application Support/com.cli-hub.tauri/cli/` | `~/Library/Application Support/com.cli-hub.tauri/db/` |
| Windows | `C:\Users\{user}\AppData\Roaming\com.cli-hub.tauri\cli\` | `C:\Users\{user}\AppData\Roaming\com.cli-hub.tauri\db\` |
| Linux | `~/.local/share/com.cli-hub.tauri/cli/` | `~/.local/share/com.cli-hub.tauri/db/` |

## Operations

### Frontend (`Settings.tsx`)

- Remove: `cliPath` state, `handleSave`, path input, save button
- Add: `cliDir` and `dataDir` state (absolute paths from backend)
- Add: "Open tools dir" and "Open data dir" buttons
- Load: call `get_tools_dir()` and `get_data_dir()` on mount to display real paths

### Frontend (`api.ts`)

- Remove: `updateSettings`
- Keep: `getSettings` (needed for language if stored there)
- Add: `openToolsDir()`, `openDataDir()`, `getDataDir()`

### Backend (`settings.rs`)

- Remove: `cli_path` field from `AppSettings`
- Remove: `update()` method
- Keep: `get_tools_dir()` — now always returns `app_dir.join("cli")`
- Add: `get_data_dir()` → `app_dir.join("db")`

### Backend (`commands/settings.rs`)

- Remove: `update_settings` command
- Add: `open_tools_dir` — uses `tauri::api::shell` or `open::that` to open `get_tools_dir()` in file manager
- Add: `open_data_dir` — opens `get_data_dir()` in file manager
- Add: `get_data_dir` — returns the path string

### Backend (`lib.rs`)

- Remove: `update_settings` registration
- Add: `open_tools_dir`, `open_data_dir`, `get_data_dir` registrations

### i18n (zh.json / en.json)

**Remove:** `cliPath`, `cliPathDesc`, `cliDirNote`, `dataNote`, `save`, `saved`, `refreshTooltip`
**Add:** `cliDirLabel`, `cliDirDesc`, `openCliDir`, `dataDirLabel`, `dataDirDesc`, `openDataDir`

## Non-changes

- `get_tools_dir()` returns `app_dir/cli/` — same default behavior, just no custom path branch
- Language selector — unchanged
- Theme toggle — unchanged
- All other UI — unchanged

## Verification

- Settings page loads and shows two absolute paths
- "Open tools dir" opens correct directory in system file manager
- "Open data dir" opens correct directory in system file manager
- Importing/deleting/executing tools works as before
- macOS, Windows, Linux each show correct platform-specific paths
- No regression in tool list functionality
