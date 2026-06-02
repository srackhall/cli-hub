# Design: xlsx-extract Smart Output Path + Sidebar Delete UX

**Date:** 2026-06-02
**Status:** design-approved

## Overview

Two independent changes:

1. **xlsx-extract**: Allow `--output` to accept a directory path, auto-generating a timestamped `.txt` file inside it, while preserving existing file-path behavior.
2. **cli-hub Sidebar**: Replace the hidden-on-hover delete icon with a right-click context menu, fixing a visibility bug at certain sidebar widths.

---

## Change A: xlsx-extract Smart Output Path

### Current behavior

- `--output` must be a file path (relative or absolute).
- Defaults to `output.txt` in the working directory.
- No directory creation; `os.WriteFile` fails if the parent directory does not exist.
- Schema field `output`: no `format` hint, has `"default": "output.txt"`.

### Desired behavior

| `--output` value | Behavior |
|---|---|
| Not provided | Default `output.txt` in CWD (unchanged) |
| Existing directory | Auto-generate `<dir>/YYYYMMDD-HHmmss.txt` |
| Existing file | Overwrite the file in place |
| Non-existent path | Treat as file path, `MkdirAll` parent dirs, write |

Timestamp format: `20060102-150405` (24-hour, local time).

### Implementation (main.go)

**New imports:** `"path/filepath"`, `"time"`

**Replace lines ~247–255** (output path resolution + write) with:

```go
outputFile := args["output"]
if outputFile == "" {
    outputFile = "output.txt"
}

// Smart path resolution
if info, err := os.Stat(outputFile); err == nil && info.IsDir() {
    ts := time.Now().Format("20060102-150405")
    outputFile = filepath.Join(outputFile, ts+".txt")
} else if err != nil {
    // Path doesn't exist — ensure parent directory exists
    if dir := filepath.Dir(outputFile); dir != "." {
        if err := os.MkdirAll(dir, 0755); err != nil {
            fmt.Fprintf(os.Stderr, msg("write_failed", err)+"\n")
            os.Exit(2)
        }
    }
}
// else: path exists and is a file — overwrite directly
```

### Schema changes

```diff
  "output": {
    "type": "string",
-   "description": "Output text file path",
-   "description_zh": "输出文本文件路径",
-   "default": "output.txt"
+   "description": "Output file or directory path. If a directory, a timestamped .txt file is created inside (e.g. 20260602-143025.txt).",
+   "description_zh": "输出文件或目录路径。若为目录则自动生成时间戳 .txt 文件（如 20260602-143025.txt）。",
+   "format": "file-path"
  }
```

- Remove `"default"` — the default is a behavior detail, not a schema-level default.
- Add `"format": "file-path"` — tells the frontend to render a file picker.
- Update both descriptions to explain the smart directory behavior.

### Affected files

- `tools/xlsx-extract/main.go` — ~15 lines changed/added

### generate-cli skill compliance

All changes follow the [generate-cli skill spec](../../.claude/skills/generate-cli.md):
- Bilingual `description` / `description_zh` in schema
- Uses existing `msg()` infrastructure for error messages
- Exit code 2 on write failure (already correct)
- No new external Go dependencies (`path/filepath` and `time` are stdlib)

---

## Change B: Sidebar Right-Click Delete

### Current behavior

Each tool item in the sidebar has an inline `<Trash2>` delete button with `opacity-0 group-hover:opacity-100`. At certain sidebar widths the button is clipped or overflows, making it invisible even on hover.

### Desired behavior

- Remove the inline delete button entirely.
- Right-clicking a tool item shows a custom context menu with a "Delete" option.
- Clicking "Delete" opens the existing confirmation dialog.
- Clicking outside the menu closes it.

### Implementation (Sidebar.tsx)

**State to add:**

```tsx
const [contextMenu, setContextMenu] = useState<{
  toolName: string
  x: number
  y: number
} | null>(null)
```

**Remove:** Lines ~129–140 (the `<Button>` + `<Trash2>` block).

**Add `onContextMenu` to the tool item `<div>`** (line ~103):

```tsx
onContextMenu={(e) => {
  e.preventDefault()
  setContextMenu({ toolName: tool.name, x: e.clientX, y: e.clientY })
}}
```

**Add context menu overlay** (render after the tool list, at component top level):

```tsx
{contextMenu && (
  <>
    {/* Backdrop to close on click outside */}
    <div
      className="fixed inset-0 z-50"
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
    />
    {/* Menu */}
    <div
      className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[120px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button
        className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
        onClick={() => {
          setContextMenu(null)
          handleDelete(contextMenu.toolName)
        }}
      >
        <Trash2 className="h-3 w-3" />
        {t("sidebar.delete")}
      </button>
    </div>
  </>
)}
```

### Behavior notes

- The `handleDelete` function (already exists) opens a confirmation dialog before calling the backend `delete_tool` command. This remains unchanged.
- The context menu appears at the exact mouse position (`clientX`, `clientY`).
- Clicking anywhere outside the menu (the backdrop) or right-clicking again closes it.
- The `z-50` ensures the menu renders above the scroll area and sidebar.

### Affected files

- `cli-hub-tauri/src/components/Sidebar.tsx` — net ~8 lines added, ~12 removed

---

## Error handling

### Change A

- Directory creation failure (`MkdirAll`) → exit code 2 with `msg("write_failed")`.
- Write failure → exit code 2 (existing behavior).
- Non-existent directory path with no file extension (e.g., `--output ./nonexistent/`) → treated as a file named `nonexistent` in `.`; `MkdirAll(".")` is a no-op, `os.WriteFile` attempts to write; if the path ends with `/` it would fail with "is a directory" from the OS — this is acceptable (user error).

### Change B

- Context menu positioned at click coordinates — if near the viewport edge, it may overflow. No edge-detection repositioning in v1 (YAGNI — the sidebar is left-aligned and tool items are in a scrollable list, overflow is unlikely).
- If `handleDelete` is called and the tool is already gone (race), the existing error handling in `delete_tool` IPC applies.

---

## Testing

### Change A

| Test case | Expected |
|---|---|
| No `--output` flag | Creates `output.txt` in CWD |
| `--output ./test/` (dir exists) | Creates `./test/20260602-HHMMSS.txt` |
| `--output ./test/out.txt` (file exists) | Overwrites `./test/out.txt` |
| `--output ./new/out.txt` (dir doesn't exist) | Creates `./new/`, writes `out.txt` |
| `--output /tmp/` (absolute dir exists) | Creates `/tmp/20260602-HHMMSS.txt` |
| Run twice with same dir | Two distinct files (different timestamps) |

### Change B

| Test case | Expected |
|---|---|
| Right-click tool item | Context menu appears at cursor |
| Click "Delete" in menu | Confirmation dialog opens |
| Confirm delete | Tool removed from sidebar |
| Click outside menu | Menu closes, no action |
| Right-click outside menu | Menu closes, new menu opens if on another tool |
| No inline delete button visible | Trash2 icon absent from tool items |

---

## Dependencies

- Change A and Change B are fully independent — they can be implemented and committed separately.
- Both changes follow existing project conventions and the generate-cli skill spec.
