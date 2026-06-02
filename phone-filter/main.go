package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

func main() {
	schemaFlag := flag.Bool("schema", false, "Output JSON Schema")
	versionFlag := flag.Bool("version", false, "Output version info")
	inputFile := flag.String("input-file", "", "Path to input file (empty = stdin)")
	prefixes := flag.String("prefixes", ";", "Semicolon-separated prefix patterns; empty segment = full data")
	showDetails := flag.Bool("show-details", false, "Include matched detail lines in report")
	output := flag.String("output", "", "Output path: directory → timestamped file; file → overwrite")

	flag.Parse()

	if *schemaFlag {
		outputSchema()
		return
	}
	if *versionFlag {
		fmt.Println("phone-filter v0.1.0 (protocol v1)")
		return
	}

	// Validate required parameters
	if *output == "" {
		fmt.Fprintln(os.Stderr, "ERROR: --output is required")
		os.Exit(1)
	}

	// Read input
	var lines []string
	if *inputFile != "" {
		data, err := os.ReadFile(*inputFile)
		if err != nil {
			fmt.Fprintf(os.Stderr, "ERROR: failed to read input file: %v\n", err)
			os.Exit(2)
		}
		lines = splitLines(string(data))
	} else {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "ERROR: failed to read stdin: %v\n", err)
			os.Exit(2)
		}
		lines = splitLines(string(data))
	}

	fmt.Fprintf(os.Stderr, "Read %d lines from input.\n", len(lines))

	// TODO: remaining logic — will be filled in subsequent tasks
	_ = prefixes
	_ = showDetails
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":             "Phone Filter",
		"titleZh":           "电话号码筛选统计",
		"description":       "Parse 11-digit phone numbers with 有/无 tags, filter by prefix, and generate statistical reports.",
		"descriptionZh":     "解析11位电话号码及有/无标记，按号段前缀筛选并生成统计报告。",
		"longDescription":   "Reads a text file (or stdin) containing lines in the format '11-digit-number----有/无', filters by user-specified number prefixes, counts by 有/无 for each prefix group, calculates percentages, and outputs a structured report. Optionally includes detailed matched lines. Invalid lines are reported at the end.",
		"longDescriptionZh": "读取包含「11位号码----有/无」格式行的文本文件（或标准输入），按用户指定的号段前缀进行筛选，分别统计每个前缀组中有/无的数量和占比，输出结构化报告。可选择性包含匹配的详细数据行。不符合格式的行将在报告末尾汇总提醒。",
		"type":              "object",
		"properties": map[string]interface{}{
			"input-file": map[string]interface{}{
				"type":          "string",
				"description":   "Input text file path (leave empty to read from stdin)",
				"descriptionZh": "输入文本文件路径（留空则从标准输入读取）",
				"format":        "file-path",
			},
			"prefixes": map[string]interface{}{
				"type":          "string",
				"description":   "Semicolon-separated number prefixes; empty segment = full dataset. E.g. ';138;139;'",
				"descriptionZh": "分号分隔的号码前缀；空段 = 全量数据。例：';138;139;'",
				"default":       ";",
			},
			"show-details": map[string]interface{}{
				"type":          "boolean",
				"description":   "Include matched detail lines in the report",
				"descriptionZh": "在报告中包含匹配的详细数据行",
				"default":       false,
			},
			"output": map[string]interface{}{
				"type":          "string",
				"description":   "Output path: directory → auto-named timestamp file; .txt file → overwrite",
				"descriptionZh": "输出路径：目录 → 自动生成时间戳文件；.txt 文件 → 直接覆盖",
				"format":        "directory-path",
			},
		},
		"required": []string{"output"},
		"x-steps": []map[string]interface{}{
			{
				"title":   "Step 1: Select Files",
				"titleZh": "步骤 1：选择文件",
				"fields":  []string{"input-file", "output"},
			},
			{
				"title":   "Step 2: Filter Options",
				"titleZh": "步骤 2：筛选选项",
				"fields":  []string{"prefixes", "show-details"},
			},
		},
	}
	b, _ := json.MarshalIndent(schema, "", "  ")
	fmt.Println(string(b))
}

func splitLines(s string) []string {
	var result []string
	for _, line := range strings.Split(s, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			result = append(result, line)
		}
	}
	return result
}
