# xlsx-extract Smart Output Path + Sidebar Delete UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two independent fixes: (1) xlsx-extract `--output` accepts a directory path to auto-generate timestamped `.txt` files; (2) Sidebar replaces hidden inline delete button with right-click context menu.

**Architecture:** Change A adds `os.Stat` path-detection logic in `main.go` (stdlib only); Change B swaps JSX event handlers and removes a DOM subtree in `Sidebar.tsx`. No shared state or cross-file dependencies.

**Tech Stack:** Go (stdlib: `path/filepath`, `time`), React 18 + TypeScript + Tailwind CSS

---

## Change A: xlsx-extract Smart Output Path

### Task A1: Modify output path resolution logic

**Files:**
- Modify: `tools/xlsx-extract/main.go:3-13` (imports)
- Modify: `tools/xlsx-extract/main.go:247-255` (output path + write)
- Modify: `tools/xlsx-extract/main.go:100-105` (schema `output` field)

- [ ] **Step 1: Add new imports**

Replace the import block at lines 3-13:

```go
import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)
```

Note: add `"path/filepath"` after `"os"` and `"time"` after `"strings"` (keep alphabetical order within stdlib group).

- [ ] **Step 2: Replace output path resolution and write logic**

Replace lines 247-255:

```go
	outputFile := args["output"]
	if outputFile == "" {
		outputFile = "output.txt"
	}

	if err := os.WriteFile(outputFile, []byte(sb.String()), 0644); err != nil {
		fmt.Fprintf(os.Stderr, msg("write_failed", err)+"\n")
		os.Exit(2)
	}
```

With:

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

	if err := os.WriteFile(outputFile, []byte(sb.String()), 0644); err != nil {
		fmt.Fprintf(os.Stderr, msg("write_failed", err)+"\n")
		os.Exit(2)
	}
```

- [ ] **Step 3: Update schema `output` field**

Replace lines 100-105:

```go
			"output": map[string]any{
				"type":           "string",
				"description":    "Output text file path",
				"description_zh": "输出文本文件路径",
				"default":        "output.txt",
			},
```

With:

```go
			"output": map[string]any{
				"type":        "string",
				"description": "Output file or directory path. If a directory, a timestamped .txt file is created inside (e.g. 20260602-143025.txt).",
				"description_zh": "输出文件或目录路径。若为目录则自动生成时间戳 .txt 文件（如 20260602-143025.txt）。",
				"format":      "file-path",
			},
```

- [ ] **Step 4: Verify compilation**

Run: `cd tools/xlsx-extract && go build -o /dev/null .`

Expected: no errors, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add tools/xlsx-extract/main.go
git commit -m "feat(xlsx-extract): smart output path — directory → timestamped .txt, file → overwrite"
```

---

## Change B: Sidebar Right-Click Delete

### Task B1: Replace inline delete button with context menu

**Files:**
- Modify: `cli-hub-tauri/src/components/Sidebar.tsx` (multiple sections)

- [ ] **Step 1: Add context menu state**

After line 23 (`const [importing, setImporting] = useState(false)`), add:

```tsx
  const [contextMenu, setContextMenu] = useState<{
    toolName: string
    x: number
    y: number
  } | null>(null)
```

- [ ] **Step 2: Add `onContextMenu` to tool item div**

On the tool item `<div>` (line 103), add `onContextMenu` after the existing `onKeyDown` (line 113). Insert after `onKeyDown={(e) => { if (e.key === "Enter") onSelectTool(tool.name) }}`:

```tsx
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ toolName: tool.name, x: e.clientX, y: e.clientY })
              }}
```

- [ ] **Step 3: Remove inline delete button**

Delete lines 129-140 (the entire `<Button>` + `<Trash2>` block):

```tsx
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(tool.name)
                }}
                title={t("sidebar.delete")}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive transition-colors" />
              </Button>
```

- [ ] **Step 4: Add context menu overlay**

After the closing `</ScrollArea>` tag (line 149) and before the closing `</div>` on line 150, insert:

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

- [ ] **Step 5: Remove unused `Button` import (if no other usage)**

Check if `Button` is still used elsewhere in the component. It is used on line 85 for the import button, so keep it.

- [ ] **Step 6: Verify TypeScript compilation**

Run: `cd cli-hub-tauri && npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add cli-hub-tauri/src/components/Sidebar.tsx
git commit -m "fix(sidebar): replace hidden inline delete button with right-click context menu"
```

---

## Verification Checklist

### Change A manual tests

- [ ] No `--output`: creates `output.txt` in CWD
- [ ] `--output ./existing-dir/`: creates `./existing-dir/YYYYMMDD-HHmmss.txt`
- [ ] `--output ./existing-file.txt`: overwrites it
- [ ] `--output ./new-dir/out.txt`: creates `./new-dir/`, writes `out.txt`
- [ ] `--output /tmp/` (absolute dir): creates timestamped file in `/tmp/`
- [ ] Run twice with same dir: two distinct files
- [ ] `--schema` output reflects new `description`/`description_zh` and `format: "file-path"`, no `default`

### Change B manual tests

- [ ] Right-click tool item → context menu appears at cursor
- [ ] Click "Delete" → confirmation dialog opens
- [ ] Confirm → tool removed from sidebar
- [ ] Click outside menu → menu closes
- [ ] Right-click another tool while menu is open → old menu closes, new one opens
- [ ] No inline delete icon visible on any tool item
- [ ] Left-click still selects tool (no regression)
- [ ] Import button still works (no regression)

---

## Self-Review

**Spec coverage check:**
- Change A: smart path resolution (directory → timestamped, file → overwrite, non-existent → MkdirAll) ✓ (Task A1 Step 2)
- Change A: schema updates (description, format, remove default) ✓ (Task A1 Step 3)
- Change B: remove inline button ✓ (Task B1 Step 3)
- Change B: add context menu with delete option ✓ (Task B1 Steps 1, 2, 4)
- Change B: confirmation dialog retained ✓ (uses existing `handleDelete`)

**Placeholder scan:** None found.

**Type consistency:** `contextMenu` state shape (`toolName: string, x: number, y: number`) matches usage in `setContextMenu` and `handleDelete(contextMenu.toolName)`. `e.clientX`/`e.clientY` match `x`/`y` number types.
