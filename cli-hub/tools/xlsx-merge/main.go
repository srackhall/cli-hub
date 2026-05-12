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
