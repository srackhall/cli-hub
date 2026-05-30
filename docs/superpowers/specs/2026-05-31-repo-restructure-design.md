# Repo Restructure: Remove Wails, Keep Tauri

**Date:** 2026-05-31
**Status:** approved

## Goal

Move `cli-hub/tools/` to the repo root as `tools/`, then delete the entire `cli-hub/` Wails project and its CI workflow (`build.yml`). The Tauri-based `cli-hub-tauri/` becomes the sole client project.

## Motivation

The project has completed migration from Wails v3 to Tauri. The old `cli-hub/` directory is no longer maintained. Keeping it adds confusion and CI build costs. The only asset worth preserving is `cli-hub/tools/` (the `xlsx-extract` CLI tool with Go source and dual-platform binaries).

## Design

### Before

```
repo-root/
├── cli-hub/               ← Wails v3 project (to delete)
│   ├── tools/
│   │   └── xlsx-extract/  ← Go CLI tool (to keep)
│   ├── frontend/
│   ├── main.go
│   └── ...
├── cli-hub-tauri/         ← Tauri project (keep)
├── .github/workflows/
│   ├── build.yml          ← Wails CI (to delete)
│   └── build-tauri.yml    ← Tauri CI (keep)
└── ...
```

### After

```
repo-root/
├── tools/                 ← moved here from cli-hub/tools/
│   └── xlsx-extract/
├── cli-hub-tauri/         ← unchanged
├── .github/workflows/
│   └── build-tauri.yml    ← sole CI workflow
└── ...
```

## Operations

| # | Operation | Command |
|---|-----------|---------|
| 1 | Move tools out | `mv cli-hub/tools .` |
| 2 | Delete cli-hub | `rm -rf cli-hub/` |
| 3 | Delete Wails CI | `rm .github/workflows/build.yml` |
| 4 | Verify | Confirm `cli-hub-tauri/` has no references to `cli-hub/` |

## Non-changes

- `cli-hub-tauri/` — no code changes; it already has zero references to `cli-hub/`
- `build-tauri.yml` — unchanged; already independent
- `docs/superpowers/` — historical docs referencing `cli-hub/` are preserved as-is

## Verification

- `cli-hub/` directory no longer exists
- `.github/workflows/build.yml` no longer exists
- `tools/xlsx-extract/` exists at repo root
- `cli-hub-tauri/` is intact and passes `npx tsc --noEmit`
- Git status shows only deletions and the move of `tools/`
