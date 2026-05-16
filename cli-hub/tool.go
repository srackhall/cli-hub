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
	Name             string `json:"name"`
	Version          string `json:"version"`
	Description      string `json:"description"`
	DescriptionZh    string `json:"descriptionZh,omitempty"`
	LongDescription  string `json:"longDescription,omitempty"`
	LongDescriptionZh string `json:"longDescriptionZh,omitempty"`
	Ready            bool   `json:"ready"`
	Error            string `json:"error,omitempty"`
}

// ToolSchema represents the parsed --schema output of a CLI tool.
type ToolSchema struct {
	Title            string                `json:"title"`
	TitleZh          string                `json:"titleZh,omitempty"`
	Description      string                `json:"description"`
	DescriptionZh    string                `json:"descriptionZh,omitempty"`
	LongDescription  string                `json:"longDescription,omitempty"`
	LongDescriptionZh string               `json:"longDescriptionZh,omitempty"`
	Type             string                `json:"type"`
	Properties       map[string]SchemaProp `json:"properties"`
	Required         []string              `json:"required"`
	XSteps           []StepGroup           `json:"x-steps,omitempty"`
}

// SchemaProp describes a single parameter.
type SchemaProp struct {
	Type          string   `json:"type"`
	Description   string   `json:"description"`
	DescriptionZh string   `json:"descriptionZh,omitempty"`
	Default       any      `json:"default,omitempty"`
	Enum          []string `json:"enum,omitempty"`
	Format        string   `json:"format,omitempty"`
	Minimum       *float64 `json:"minimum,omitempty"`
	Maximum       *float64 `json:"maximum,omitempty"`
	Items         *struct {
		Type string `json:"type"`
	} `json:"items,omitempty"`
}

// validateToolName checks that a tool name doesn't contain path separators
// to prevent directory traversal attacks.
func validateToolName(name string) bool {
	if name == "" || strings.Contains(name, "/") || strings.Contains(name, "\\") {
		return false
	}
	return filepath.Base(name) == name && name != "." && name != ".."
}

// StepGroup defines a group of fields for multi-step forms.
type StepGroup struct {
	Title   string   `json:"title"`
	TitleZh string   `json:"titleZh,omitempty"`
	Fields  []string `json:"fields"`
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
			tool.DescriptionZh = schema.DescriptionZh
			tool.LongDescription = schema.LongDescription
			tool.LongDescriptionZh = schema.LongDescriptionZh
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
