package main

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// ExecuteResult is the summary returned after execution completes.
type ExecuteResult struct {
	Status string `json:"status"`
	Output string `json:"output"`
	Code   int    `json:"code"`
}

// validParamName matches CLI-safe parameter names (letters, digits, hyphens).
var validParamName = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9.-]*$`)

// ExecuteTool runs a CLI tool with the given parameters and streams output.
func (a *App) ExecuteTool(name string, params map[string]any) *ExecuteResult {
	if !validateToolName(name) {
		return &ExecuteResult{Status: "error", Output: "invalid tool name", Code: -1}
	}
	toolPath := filepath.Join(a.settings.GetToolsDir(), name)

	args := buildArgs(params)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cmd := newCommand(ctx, toolPath, args...)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return &ExecuteResult{Status: "error", Output: err.Error(), Code: -1}
	}

	// Stream stdout and stderr, waiting for both to finish before returning.
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			application.Get().Event.Emit("tool-output", map[string]any{
				"stream": "stdout",
				"text":   line,
			})
		}
	}()

	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			application.Get().Event.Emit("tool-output", map[string]any{
				"stream": "stderr",
				"text":   line,
			})
		}
	}()

	err := cmd.Wait()
	wg.Wait()
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
		if !validParamName.MatchString(k) {
			continue
		}
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
