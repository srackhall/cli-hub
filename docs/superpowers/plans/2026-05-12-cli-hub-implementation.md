# CLI Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Wails v3 desktop app that dynamically scans, displays, and executes Go CLI tools from a `tools/` directory, rendering parameter forms from each CLI's `--schema` output.

**Architecture:** Wails v3 desktop app with a React+shadcn/ui frontend and a Go backend. The backend scans `tools/` for binaries, calls `--schema` on each to get JSON Schema, and executes them via `os/exec` with real-time log streaming via Wails events. The frontend dynamically renders forms from schema, supports multi-step via `x-steps`, and shows live execution output.

**Tech Stack:** Wails v3, Go 1.22+, Vite, React 18, TypeScript, shadcn/ui, Tailwind CSS

---

### Task 1: Scaffold Wails v3 Project

**Files:**
- Create: `cli-hub/` (Wails project root)

- [ ] **Step 1: Install Wails v3 CLI**

Run:
```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

- [ ] **Step 2: Scaffold the project**

Run:
```bash
wails3 init -n cli-hub -t react-ts
```

- [ ] **Step 3: Verify the scaffold runs**

Run:
```bash
cd cli-hub && wails3 dev
```
Expected: Desktop window opens with default React template.

- [ ] **Step 4: Commit**

```bash
git add cli-hub/
git commit -m "feat: scaffold Wails v3 project with React+TS template"
```

---

### Task 2: Set Up Frontend Dependencies (shadcn/ui + Tailwind)

**Files:**
- Modify: `cli-hub/frontend/package.json`
- Create: `cli-hub/frontend/components.json`
- Modify: `cli-hub/frontend/tailwind.config.js`
- Modify: `cli-hub/frontend/src/index.css`

- [ ] **Step 1: Install shadcn/ui and dependencies**

Run:
```bash
cd cli-hub/frontend
npm install tailwindcss @tailwindcss/vite @radix-ui/react-slot @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-label class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node
```

- [ ] **Step 2: Configure Tailwind with Vite**

Modify `cli-hub/frontend/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add Tailwind directives to CSS**

Replace `cli-hub/frontend/src/index.css`:
```css
@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 4: Create cn utility**

Create `cli-hub/frontend/src/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Verify dev server starts**

Run:
```bash
cd cli-hub && wails3 dev
```
Expected: No CSS errors, window renders.

- [ ] **Step 6: Commit**

```bash
git add cli-hub/frontend/
git commit -m "feat: add shadcn/ui and Tailwind CSS to frontend"
```

---

### Task 3: Create shadcn/ui Base Components

**Files:**
- Create: `cli-hub/frontend/src/components/ui/button.tsx`
- Create: `cli-hub/frontend/src/components/ui/input.tsx`
- Create: `cli-hub/frontend/src/components/ui/select.tsx`
- Create: `cli-hub/frontend/src/components/ui/checkbox.tsx`
- Create: `cli-hub/frontend/src/components/ui/label.tsx`
- Create: `cli-hub/frontend/src/components/ui/scroll-area.tsx`
- Create: `cli-hub/frontend/src/components/ui/badge.tsx`

- [ ] **Step 1: Create Button component**

Create `cli-hub/frontend/src/components/ui/button.tsx`:
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Create Input component**

Create `cli-hub/frontend/src/components/ui/input.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

- [ ] **Step 3: Create Select component**

Create `cli-hub/frontend/src/components/ui/select.tsx`:
```tsx
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
```

- [ ] **Step 4: Create Checkbox component**

Create `cli-hub/frontend/src/components/ui/checkbox.tsx`:
```tsx
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

- [ ] **Step 5: Create Label component**

Create `cli-hub/frontend/src/components/ui/label.tsx`:
```tsx
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 6: Create Badge component**

Create `cli-hub/frontend/src/components/ui/badge.tsx`:
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 7: Verify build**

Run:
```bash
cd cli-hub/frontend && npm run build
```
Expected: No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add cli-hub/frontend/src/components/ui/ cli-hub/frontend/src/lib/
git commit -m "feat: add shadcn/ui base components (Button, Input, Select, Checkbox, Label, Badge)"
```

---

### Task 4: Go Backend - Types and Tool Scanner

**Files:**
- Create: `cli-hub/tool.go`
- Modify: `cli-hub/main.go`

- [ ] **Step 1: Create tool types and scanner**

Create `cli-hub/tool.go`:
```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// ToolInfo represents a discovered CLI tool.
type ToolInfo struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
	Ready       bool   `json:"ready"`
	Error       string `json:"error,omitempty"`
}

// ToolSchema represents the parsed --schema output of a CLI tool.
type ToolSchema struct {
	Title       string                `json:"title"`
	Description string                `json:"description"`
	Type        string                `json:"type"`
	Properties  map[string]SchemaProp `json:"properties"`
	Required    []string              `json:"required"`
	XSteps      []StepGroup           `json:"x-steps,omitempty"`
}

// SchemaProp describes a single parameter.
type SchemaProp struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Default     any      `json:"default,omitempty"`
	Enum        []string `json:"enum,omitempty"`
	Format      string   `json:"format,omitempty"`
	Minimum     *float64 `json:"minimum,omitempty"`
	Maximum     *float64 `json:"maximum,omitempty"`
	Items       *struct {
		Type string `json:"type"`
	} `json:"items,omitempty"`
}

// StepGroup defines a group of fields for multi-step forms.
type StepGroup struct {
	Title  string   `json:"title"`
	Fields []string `json:"fields"`
}

// ScanTools scans the tools/ directory for executable binaries
// and calls --schema on each to validate they are ready.
func ScanTools(toolsDir string) []ToolInfo {
	entries, err := os.ReadDir(toolsDir)
	if err != nil {
		return nil
	}

	var tools []ToolInfo
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		path := filepath.Join(toolsDir, name)

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.Mode()&0111 == 0 {
			continue
		}

		tool := ToolInfo{Name: name}

		version, verr := getToolVersion(path)
		if verr == nil {
			tool.Version = version
		}

		schema, serr := getToolSchema(path)
		if serr != nil {
			tool.Ready = false
			tool.Error = serr.Error()
		} else {
			tool.Description = schema.Description
			tool.Ready = true
		}

		tools = append(tools, tool)
	}

	return tools
}

func getToolVersion(toolPath string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, toolPath, "--version")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(output)), nil
}

func getToolSchema(toolPath string) (*ToolSchema, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, toolPath, "--schema")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("schema call failed: %w", err)
	}

	var schema ToolSchema
	if err := json.Unmarshal(output, &schema); err != nil {
		return nil, fmt.Errorf("invalid schema JSON: %w", err)
	}

	return &schema, nil
}
```

- [ ] **Step 2: Update main.go to wire up ScanTools**

Modify `cli-hub/main.go` to export `ListTools`:
```go
package main

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

// App represents the Wails application with bindings.
type App struct {
	toolsDir string
}

// ListTools scans and returns all available CLI tools.
func (a *App) ListTools() []ToolInfo {
	return ScanTools(a.toolsDir)
}

func main() {
	app := &App{
		toolsDir: "./tools",
	}

	wailsApp := application.New(application.Options{
		Name: "CLI Hub",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServer("./frontend/dist"),
		},
		Services: []application.Service{
			application.NewService(app),
		},
		Width:  1024,
		Height: 768,
	})

	wailsApp.Run()
}
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
cd cli-hub && go build -o cli-hub .
```
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add cli-hub/tool.go cli-hub/main.go
git commit -m "feat: add Go backend tool scanner with --schema support"
```

---

### Task 5: Go Backend - Tool Execution

**Files:**
- Create: `cli-hub/executor.go`

- [ ] **Step 1: Create executor.go**

Create `cli-hub/executor.go`:
```go
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// ExecuteResult is the summary returned after execution completes.
type ExecuteResult struct {
	Status string `json:"status"`
	Output string `json:"output"`
	Code   int    `json:"code"`
}

// ExecuteTool runs a CLI tool with the given parameters and streams output.
func (a *App) ExecuteTool(name string, params map[string]any) *ExecuteResult {
	toolPath := a.toolsDir + "/" + name

	args := buildArgs(params)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(ctx, toolPath, args...)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return &ExecuteResult{Status: "error", Output: err.Error(), Code: -1}
	}

	// Stream stdout line by line
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			application.Get().EmitEvent("tool-output", map[string]any{
				"stream": "stdout",
				"text":   line,
			})
		}
	}()

	// Stream stderr line by line
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			application.Get().EmitEvent("tool-output", map[string]any{
				"stream": "stderr",
				"text":   line,
			})
		}
	}()

	err := cmd.Wait()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			code := exitErr.ExitCode()
			msg := "runtime error"
			if code == 1 {
				msg = "parameter error"
			}
			return &ExecuteResult{Status: "error", Output: msg, Code: code}
		}
		return &ExecuteResult{Status: "error", Output: err.Error(), Code: -1}
	}

	return &ExecuteResult{Status: "ok", Output: "execution complete", Code: 0}
}

// buildArgs converts a params map to CLI arguments.
// --param value for flags, positional for "args".
func buildArgs(params map[string]any) []string {
	var args []string
	for k, v := range params {
		switch val := v.(type) {
		case bool:
			if val {
				args = append(args, "--"+k)
			}
		case string:
			if val != "" {
				args = append(args, "--"+k, val)
			}
		case []any:
			for _, item := range val {
				if s, ok := item.(string); ok {
					args = append(args, "--"+k, s)
				}
			}
		case float64:
			args = append(args, "--"+k, fmt.Sprintf("%v", val))
		}
	}
	return args
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd cli-hub && go build -o cli-hub .
```
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add cli-hub/executor.go
git commit -m "feat: add CLI tool execution with real-time output streaming"
```

---

### Task 6: Frontend - App Shell Layout

**Files:**
- Create: `cli-hub/frontend/src/App.tsx`
- Modify: `cli-hub/frontend/src/main.tsx`

- [ ] **Step 1: Create the app shell layout**

Create `cli-hub/frontend/src/App.tsx`:
```tsx
import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import type { ToolInfo } from "@/types"

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<Array<{ stream: string; text: string; ts: number }>>([])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tools={tools}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
        <MainPanel
          selectedTool={selectedTool}
          onLog={(entry) => setLogs((prev) => [...prev, entry])}
        />
      </div>
      <Console logs={logs} />
      <StatusBar toolCount={tools.length} readyCount={tools.filter((t) => t.ready).length} />
    </div>
  )
}
```

- [ ] **Step 2: Update main.tsx**

Modify `cli-hub/frontend/src/main.tsx`:
```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Create TypeScript types**

Create `cli-hub/frontend/src/types.ts`:
```ts
export interface ToolInfo {
  name: string
  version: string
  description: string
  ready: boolean
  error?: string
}

export interface ToolSchema {
  title?: string
  description?: string
  type: string
  properties: Record<string, SchemaProp>
  required?: string[]
  "x-steps"?: StepGroup[]
}

export interface SchemaProp {
  type: string
  description?: string
  default?: unknown
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
  items?: { type: string }
}

export interface StepGroup {
  title: string
  fields: string[]
}

export interface LogEntry {
  stream: "stdout" | "stderr"
  text: string
  ts: number
}
```

- [ ] **Step 4: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npm run build
```
Expected: No TypeScript errors (dummy components may not exist yet — expect import errors, that's OK for now).

- [ ] **Step 5: Commit**

```bash
git add cli-hub/frontend/src/
git commit -m "feat: add app shell layout with Sidebar, MainPanel, Console, StatusBar stubs"
```

---

### Task 7: Frontend - Sidebar Component

**Files:**
- Create: `cli-hub/frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar with search and tool list**

Create `cli-hub/frontend/src/components/Sidebar.tsx`:
```tsx
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Box } from "lucide-react"
import type { ToolInfo } from "@/types"

interface SidebarProps {
  tools: ToolInfo[]
  selectedTool: string | null
  onSelectTool: (name: string) => void
}

export function Sidebar({ tools, selectedTool, onSelectTool }: SidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-56 border-r flex flex-col bg-muted/30">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map((tool) => (
            <button
              key={tool.name}
              onClick={() => onSelectTool(tool.name)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                selectedTool === tool.name
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 text-foreground"
              }`}
            >
              <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{tool.name}</span>
              {!tool.ready && (
                <Badge variant="destructive" className="ml-auto shrink-0 text-[10px] px-1.5 py-0">
                  Err
                </Badge>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tools.length === 0 ? "No tools found" : "No matches"}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 2: Create ScrollArea component**

Create `cli-hub/frontend/src/components/ui/scroll-area.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("overflow-auto", className)} {...props}>
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
```

- [ ] **Step 3: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npx tsc --noEmit
```
Expected: No errors from these files.

- [ ] **Step 4: Commit**

```bash
git add cli-hub/frontend/src/components/Sidebar.tsx cli-hub/frontend/src/components/ui/scroll-area.tsx
git commit -m "feat: add Sidebar component with search and tool list"
```

---

### Task 8: Frontend - Dynamic Form Renderer

**Files:**
- Create: `cli-hub/frontend/src/components/DynamicForm.tsx`

- [ ] **Step 1: Create DynamicForm component**

Create `cli-hub/frontend/src/components/DynamicForm.tsx`:
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import type { ToolSchema, SchemaProp } from "@/types"

interface DynamicFormProps {
  schema: ToolSchema
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function DynamicForm({ schema, values, onChange }: DynamicFormProps) {
  const fields = Object.entries(schema.properties ?? {})

  return (
    <div className="space-y-4">
      {fields.map(([key, prop]) => (
        <FormField
          key={key}
          name={key}
          prop={prop}
          value={values[key]}
          onChange={(v) => onChange(key, v)}
        />
      ))}
    </div>
  )
}

function FormField({
  name,
  prop,
  value,
  onChange,
}: {
  name: string
  prop: SchemaProp
  value: unknown
  onChange: (v: unknown) => void
}) {
  const label = prop.description ?? name
  const isRequired = false // we don't have required list here, passed via schema.required

  // Boolean -> Checkbox
  if (prop.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={name}
          checked={value as boolean ?? prop.default as boolean ?? false}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
      </div>
    )
  }

  // Enum -> Select
  if (prop.enum && prop.enum.length > 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Select
          value={(value as string) ?? (prop.default as string) ?? ""}
          onValueChange={(v) => onChange(v === "__empty__" ? "" : v)}
        >
          <SelectTrigger id={name}>
            <SelectValue placeholder={`Select ${label}...`} />
          </SelectTrigger>
          <SelectContent>
            {!isRequired && <SelectItem value="__empty__">(none)</SelectItem>}
            {prop.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // number / integer
  if (prop.type === "number" || prop.type === "integer") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          type="number"
          min={prop.minimum}
          max={prop.maximum}
          value={(value as number | string) ?? (prop.default as number | string) ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? "" : Number(e.target.value)
            onChange(v)
          }}
        />
      </div>
    )
  }

  // array of strings
  if (prop.type === "array" && prop.items?.type === "string") {
    const items = (value as string[]) ?? (prop.default as string[]) ?? []
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = e.target.value
                  onChange(next)
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx)
                  onChange(next)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, ""])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    )
  }

  // string (default) — covers file-path, directory-path, and plain strings
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        value={(value as string) ?? (prop.default as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prop.format === "file-path" ? "/path/to/file" : prop.format === "directory-path" ? "/path/to/dir" : ""}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add cli-hub/frontend/src/components/DynamicForm.tsx
git commit -m "feat: add DynamicForm component rendering fields from JSON Schema"
```

---

### Task 9: Frontend - MainPanel with Multi-Step Support

**Files:**
- Create: `cli-hub/frontend/src/components/MainPanel.tsx`

- [ ] **Step 1: Create MainPanel with step navigation**

Create `cli-hub/frontend/src/components/MainPanel.tsx`:
```tsx
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DynamicForm } from "@/components/DynamicForm"
import { Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import type { ToolSchema } from "@/types"

interface MainPanelProps {
  selectedTool: string | null
  onLog: (entry: { stream: string; text: string; ts: number }) => void
}

export function MainPanel({ selectedTool, onLog }: MainPanelProps) {
  const [schema, setSchema] = useState<ToolSchema | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [running, setRunning] = useState(false)

  // Load schema when tool changes
  useEffect(() => {
    if (!selectedTool) {
      setSchema(null)
      setValues({})
      setCurrentStep(0)
      return
    }

    async function load() {
      try {
        // @ts-expect-error - Wails runtime
        const s = await window.go.main.App.GetSchema(selectedTool)
        setSchema(s)
        setValues({})
        setCurrentStep(0)
      } catch (e) {
        setSchema(null)
      }
    }
    load()
  }, [selectedTool])

  const steps = useMemo(() => {
    if (!schema?.properties) return null
    const xsteps = schema["x-steps"]
    if (!xsteps || xsteps.length === 0) {
      return [{ title: "Parameters", fields: Object.keys(schema.properties) }]
    }
    return xsteps
  }, [schema])

  const currentFields = steps?.[currentStep]?.fields ?? []

  const handleExecute = async () => {
    if (!selectedTool) return
    setRunning(true)
    onLog({ stream: "stdout", text: `Starting ${selectedTool}...`, ts: Date.now() })
    try {
      // @ts-expect-error - Wails runtime
      const result = await window.go.main.App.ExecuteTool(selectedTool, values)
      if (result.code === 0) {
        onLog({ stream: "stdout", text: `SUCCESS (${result.output})`, ts: Date.now() })
      } else {
        onLog({ stream: "stderr", text: `ERROR [code ${result.code}]: ${result.output}`, ts: Date.now() })
      }
    } catch (e) {
      onLog({ stream: "stderr", text: `Execution failed: ${e}`, ts: Date.now() })
    }
    setRunning(false)
  }

  const handleReset = () => {
    setValues({})
    setCurrentStep(0)
  }

  if (!selectedTool) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a tool from the sidebar to get started.</p>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{schema.title ?? selectedTool}</h2>
          <Badge variant="secondary">{selectedTool}</Badge>
        </div>
        {schema.description && (
          <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
        )}
      </div>

      {/* Step indicator */}
      {steps && steps.length > 1 && (
        <div className="px-6 py-2 border-b flex items-center gap-2 text-sm">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1">
              {idx > 0 && <span className="text-muted-foreground">/</span>}
              <span
                className={`${
                  idx === currentStep
                    ? "text-foreground font-medium"
                    : idx < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Form body */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {schema && (
          <DynamicForm
            schema={{
              ...schema,
              properties: Object.fromEntries(
                currentFields.map((f) => [f, schema.properties![f]]).filter(([, p]) => !!p)
              ),
            }}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />
        )}
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-t flex items-center justify-between">
        <div className="flex gap-2">
          {steps && currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
          )}
          {steps && currentStep < steps.length - 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleExecute} disabled={running}>
            <Play className="h-4 w-4 mr-1" /> {running ? "Running..." : "Execute"}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add cli-hub/frontend/src/components/MainPanel.tsx
git commit -m "feat: add MainPanel with multi-step form navigation and execution"
```

---

### Task 10: Frontend - Console and StatusBar

**Files:**
- Create: `cli-hub/frontend/src/components/Console.tsx`
- Create: `cli-hub/frontend/src/components/StatusBar.tsx`

- [ ] **Step 1: Create Console component**

Create `cli-hub/frontend/src/components/Console.tsx`:
```tsx
import { useEffect, useRef } from "react"
import type { LogEntry } from "@/types"

interface ConsoleProps {
  logs: LogEntry[]
}

export function Console({ logs }: ConsoleProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [logs])

  return (
    <div ref={ref} className="h-40 border-t overflow-auto bg-black text-green-400 font-mono text-xs p-3">
      {logs.length === 0 && (
        <p className="text-green-700">Ready. Select a tool and click Execute to begin.</p>
      )}
      {logs.map((entry, i) => (
        <div key={i} className={entry.stream === "stderr" ? "text-red-400" : "text-green-400"}>
          <span className="text-green-700">
            [{new Date(entry.ts).toLocaleTimeString()}]
          </span>{" "}
          {entry.text}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create StatusBar component**

Create `cli-hub/frontend/src/components/StatusBar.tsx`:
```tsx
import { CheckCircle2, AlertCircle } from "lucide-react"

interface StatusBarProps {
  toolCount: number
  readyCount: number
}

export function StatusBar({ toolCount, readyCount }: StatusBarProps) {
  const allReady = toolCount > 0 && readyCount === toolCount

  return (
    <div className="h-7 border-t flex items-center justify-between px-4 text-xs text-muted-foreground bg-muted/30">
      <span>
        tools/ ({toolCount} tool{toolCount !== 1 ? "s" : ""})
      </span>
      {toolCount > 0 && (
        <span className="flex items-center gap-1">
          {allReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-600">All Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-600">
                {readyCount}/{toolCount} Ready
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add cli-hub/frontend/src/components/Console.tsx cli-hub/frontend/src/components/StatusBar.tsx
git commit -m "feat: add Console and StatusBar components"
```

---

### Task 11: Wire Wails Bridge - Data Loading on Startup

**Files:**
- Modify: `cli-hub/frontend/src/App.tsx`

- [ ] **Step 1: Add startup data load via Wails bridge**

Modify `cli-hub/frontend/src/App.tsx` to load tools on mount:
```tsx
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainPanel } from "@/components/MainPanel"
import { Console } from "@/components/Console"
import { StatusBar } from "@/components/StatusBar"
import type { ToolInfo, LogEntry } from "@/types"

export default function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    async function load() {
      try {
        // @ts-expect-error - Wails runtime injected at build time
        const list = await window.go.main.App.ListTools()
        setTools(list)
        if (list.length > 0) {
          setSelectedTool(list[0].name)
        }
      } catch (e) {
        console.error("Failed to load tools:", e)
      }
    }
    load()
  }, [])

  // Listen for real-time tool output events
  useEffect(() => {
    try {
      // @ts-expect-error - Wails runtime
      window.go.main.App.OnToolOutput((data: { stream: string; text: string }) => {
        setLogs((prev) => [
          ...prev,
          { stream: data.stream, text: data.text, ts: Date.now() },
        ])
      })
    } catch (e) {
      // Event listener not available in dev without Wails runtime
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tools={tools}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
        <MainPanel
          selectedTool={selectedTool}
          onLog={(entry) => setLogs((prev) => [...prev, entry])}
        />
      </div>
      <Console logs={logs} />
      <StatusBar toolCount={tools.length} readyCount={tools.filter((t) => t.ready).length} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript build**

Run:
```bash
cd cli-hub/frontend && npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add cli-hub/frontend/src/App.tsx
git commit -m "feat: wire Wails bridge for tool list loading and real-time output events"
```

---

### Task 12: Mock CLI for Development Testing

**Files:**
- Create: `cli-hub/tools/xlsx-merge/main.go`

- [ ] **Step 1: Create a mock CLI that implements --schema and --version**

Create `cli-hub/tools/xlsx-merge/main.go`:
```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: xlsx-merge --schema|--version|--input <file> --output <dir>")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "--schema":
		outputSchema()
	case "--version":
		fmt.Println("xlsx-merge v1.2.0 (protocol v1)")
	default:
		// Simulate execution
		input := getArg("input")
		output := getArg("output")
		fmt.Printf("Processing %s...\n", input)
		fmt.Printf("Writing to %s...\n", output)
		fmt.Println(`{"status":"ok","output":"merged successfully"}`)
	}
}

func outputSchema() {
	schema := map[string]any{
		"title":       "XLSX Merge",
		"description": "Merge multiple xlsx files by row or column into a single file.",
		"type":        "object",
		"properties": map[string]any{
			"input": map[string]any{
				"type":        "array",
				"description": "Input xlsx files",
				"items":       map[string]string{"type": "string"},
				"format":      "file-path",
			},
			"output": map[string]any{
				"type":        "string",
				"description": "Output directory",
				"format":      "directory-path",
			},
			"merge-mode": map[string]any{
				"type":        "string",
				"description": "Merge direction",
				"enum":        []string{"by-row", "by-column"},
				"default":     "by-row",
			},
			"skip-empty": map[string]any{
				"type":        "boolean",
				"description": "Skip empty rows",
				"default":     false,
			},
			"sheet-name": map[string]any{
				"type":        "string",
				"description": "Target sheet name",
				"default":     "Sheet1",
			},
		},
		"required": []string{"input", "output"},
		"x-steps": []map[string]any{
			{
				"title":  "Step 1: Select Files",
				"fields": []string{"input", "output"},
			},
			{
				"title":  "Step 2: Merge Options",
				"fields": []string{"merge-mode", "skip-empty", "sheet-name"},
			},
		},
	}

	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}

func getArg(name string) string {
	for i, a := range os.Args {
		if a == "--"+name && i+1 < len(os.Args) {
			return os.Args[i+1]
		}
	}
	return ""
}
```

- [ ] **Step 2: Build the mock CLI**

Run:
```bash
cd cli-hub/tools/xlsx-merge && go build -o ../xlsx-merge .
```

- [ ] **Step 3: Verify --schema and --version work**

Run:
```bash
cd cli-hub && ./tools/xlsx-merge --schema
./tools/xlsx-merge --version
```
Expected: `--schema` outputs valid JSON; `--version` outputs version string.

- [ ] **Step 4: Commit**

```bash
git add cli-hub/tools/
git commit -m "feat: add mock xlsx-merge CLI for development testing"
```

---

### Task 13: Create generate-cli Skill

**Files:**
- Create: `.claude/skills/generate-cli.md`

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/generate-cli.md`:
```markdown
---
name: generate-cli
description: Generate a Go CLI tool that complies with CLI Hub interface standards. Use when creating new data processing tools for the CLI Hub desktop app.
---

# Generate CLI Hub Tool

Generate a Go CLI tool that follows the CLI Hub interface specification. The generated code must implement `--schema`, `--version`, standard exit codes, and the agreed output format.

## Required Conventions

### --schema (Required)

Output JSON Schema describing all parameters:

```json
{
  "title": "Tool Display Name",
  "description": "What this tool does",
  "type": "object",
  "properties": {
    "param-name": {
      "type": "string|number|integer|boolean|array",
      "description": "Human-readable description",
      "default": "default value (optional)",
      "enum": ["option1", "option2"],
      "format": "file-path|directory-path (optional)"
    }
  },
  "required": ["param-name"],
  "x-steps": [
    { "title": "Step 1: ...", "fields": ["param1", "param2"] },
    { "title": "Step 2: ...", "fields": ["param3"] }
  ]
}
```

### Field Type Mapping

| JSON Schema | UI Component |
|------------|-------------|
| `string` | Text input |
| `string` + `format: "file-path"` | File picker |
| `string` + `format: "directory-path"` | Directory picker |
| `string` + `enum: [...]` | Dropdown select |
| `number` / `integer` | Number input |
| `boolean` | Checkbox |
| `array` + `items: {type: string}` | Addable input list |

### Exit Codes

- `0` — Success
- `1` — Parameter error (validation failed)
- `2` — Runtime error (file not found, format error, etc.)

### Output Format

- stdout: Normal logs; last line must be JSON: `{"status":"ok","output":"..."}`
- stderr: Error messages and progress lines as JSON: `{"progress":50,"message":"..."}`

### --version

Output: `<name> v<semver> (protocol v1)`

## Code Template

Generate a `main.go` file:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

func main() {
    if len(os.Args) < 2 {
        fmt.Fprintln(os.Stderr, "Usage: <tool> --schema|--version|<params>")
        os.Exit(1)
    }

    switch os.Args[1] {
    case "--schema":
        b, _ := json.MarshalIndent(getSchema(), "", "  ")
        fmt.Println(string(b))
    case "--version":
        fmt.Println("<tool-name> v0.1.0 (protocol v1)")
    default:
        run()
    }
}

func getSchema() map[string]any {
    // Define parameters per the schema above
    return map[string]any{
        "title":       "...",
        "description": "...",
        "type":        "object",
        "properties":  map[string]any{},
        "required":    []string{},
    }
}

func run() {
    // Parse args, do work, output results
    // Last stdout line: {"status":"ok","output":"..."}
    // On error: os.Exit(1) or os.Exit(2)
}
```

## Instructions

When the user describes what the CLI should do:

1. Identify all parameters (inputs, outputs, options)
2. Map each parameter to the correct JSON Schema type
3. If there are more than 4 parameters, group them into logical `x-steps`
4. Generate complete, compilable Go code
5. The generated code must be a single `main.go` ready for `go build`
```

- [ ] **Step 2: Verify skill file**

Run:
```bash
cat .claude/skills/generate-cli.md
```
Expected: Valid frontmatter + body.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/generate-cli.md
git commit -m "feat: add generate-cli skill for AI-assisted CLI tool creation"
```

---

### Task 14: End-to-End Smoke Test

- [ ] **Step 1: Build the mock CLI**

Run:
```bash
cd cli-hub/tools/xlsx-merge && go build -o ../xlsx-merge .
```

- [ ] **Step 2: Start Wails dev mode**

Run:
```bash
cd cli-hub && wails3 dev
```
Expected: Desktop window appears.

- [ ] **Step 3: Verify tool appears in sidebar**

Expected: "xlsx-merge" appears in the sidebar tool list.

- [ ] **Step 4: Select the tool and verify form**

Expected: Main panel shows "XLSX Merge" header, description text, and a 2-step form.

- [ ] **Step 5: Fill in parameters and execute**

Expected: Console shows execution logs, ends with "SUCCESS".

- [ ] **Step 6: Verify status bar**

Expected: Status bar shows "tools/ (1 tool) All Ready".
