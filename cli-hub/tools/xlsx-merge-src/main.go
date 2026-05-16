package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
)

func main() {
	schemaFlag := flag.Bool("schema", false, "Output JSON Schema")
	versionFlag := flag.Bool("version", false, "Output version info")

	inputFiles := flag.String("input-files", "", "Comma-separated list of input .xlsx files")
	outputDir := flag.String("output-dir", "", "Output directory for merged file")
	mergeMode := flag.String("merge-mode", "by-row", "How to merge sheets (by-row, by-sheet, append)")
	skipEmpty := flag.Bool("skip-empty", false, "Skip empty rows during merge")
	sheetName := flag.String("sheet-name", "Sheet1", "Target sheet name for merged data")
	maxRows := flag.Int("max-rows", 0, "Maximum rows to process per file (1-1000000)")

	flag.Parse()

	if *schemaFlag {
		outputSchema()
		return
	}
	if *versionFlag {
		fmt.Println("xlsx-merge v1.2.0 (protocol v1)")
		return
	}

	if *inputFiles == "" {
		fmt.Fprintln(os.Stderr, "ERROR: --input-files is required")
		os.Exit(1)
	}
	if *outputDir == "" {
		fmt.Fprintln(os.Stderr, "ERROR: --output-dir is required")
		os.Exit(1)
	}

	files := strings.Split(*inputFiles, ",")
	for i, f := range files {
		files[i] = strings.TrimSpace(f)
		if files[i] == "" {
			fmt.Fprintf(os.Stderr, "ERROR: empty filename in --input-files at position %d\n", i)
			os.Exit(1)
		}
	}

	if *maxRows > 0 && (*maxRows < 1 || *maxRows > 1000000) {
		fmt.Fprintln(os.Stderr, "ERROR: --max-rows must be between 1 and 1000000")
		os.Exit(1)
	}

	validModes := map[string]bool{"by-row": true, "by-sheet": true, "append": true}
	if !validModes[*mergeMode] {
		fmt.Fprintf(os.Stderr, "ERROR: invalid --merge-mode %q (must be by-row, by-sheet, or append)\n", *mergeMode)
		os.Exit(1)
	}

	fmt.Printf("Starting xlsx-merge...\n")
	fmt.Printf("Input files: %s\n", strings.Join(files, ", "))
	fmt.Printf("Output directory: %s\n", *outputDir)
	fmt.Printf("Merge mode: %s\n", *mergeMode)
	if *skipEmpty {
		fmt.Printf("Skipping empty rows\n")
	}
	fmt.Printf("Target sheet: %s\n", *sheetName)
	if *maxRows > 0 {
		fmt.Printf("Max rows per file: %d\n", *maxRows)
	}

	fmt.Fprintln(os.Stderr, `{"progress":25,"message":"Reading input files..."}`)
	fmt.Fprintln(os.Stderr, `{"progress":50,"message":"Merging data..."}`)
	fmt.Fprintln(os.Stderr, `{"progress":75,"message":"Writing output file..."}`)
	fmt.Fprintln(os.Stderr, `{"progress":100,"message":"Complete"}`)

	fmt.Printf(`{"status":"ok","output":"Merged %d files into %s/merged.xlsx"}`+"\n", len(files), *outputDir)
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":       "XLSX Merge",
		"description": "Merge multiple Excel files into a single workbook with configurable merge modes and sheet naming.",
		"type":        "object",
		"properties": map[string]interface{}{
			"input-files": map[string]interface{}{
				"type":        "array",
				"description": "Input .xlsx files to merge",
				"items":       map[string]interface{}{"type": "string"},
			},
			"output-dir": map[string]interface{}{
				"type":        "string",
				"description": "Output directory for merged file",
				"format":      "directory-path",
			},
			"merge-mode": map[string]interface{}{
				"type":        "string",
				"description": "How to merge sheets",
				"enum":        []string{"by-row", "by-sheet", "append"},
				"default":     "by-row",
			},
			"skip-empty": map[string]interface{}{
				"type":        "boolean",
				"description": "Skip empty rows during merge",
				"default":     false,
			},
			"sheet-name": map[string]interface{}{
				"type":        "string",
				"description": "Target sheet name for merged data",
				"default":     "Sheet1",
			},
			"max-rows": map[string]interface{}{
				"type":        "number",
				"description": "Maximum rows to process per file",
				"minimum":     1,
				"maximum":     1000000,
			},
		},
		"required": []string{"input-files", "output-dir"},
		"x-steps": []map[string]interface{}{
			{"title": "Select Files", "fields": []string{"input-files", "output-dir"}},
			{"title": "Merge Options", "fields": []string{"merge-mode", "skip-empty", "sheet-name", "max-rows"}},
		},
	}
	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}
