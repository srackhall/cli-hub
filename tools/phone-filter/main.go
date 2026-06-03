package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func main() {
	schemaFlag := flag.Bool("schema", false, "Output JSON Schema")
	versionFlag := flag.Bool("version", false, "Output version info")
	inputFile := flag.String("input-file", "", "Path to input file (empty = stdin)")
	prefixes := flag.String("prefixes", ";", "Semicolon-separated prefix patterns; empty segment = full data")
	showDetails := flag.Bool("show-details", false, "Include matched detail lines in report")
	output := flag.String("output", "", "Output path: directory → timestamped file; file → overwrite")

	// Filter out -lang/--lang flags that CLI Hub injects
	filteredArgs := filterLangFlag(os.Args[1:])
	os.Args = append([]string{os.Args[0]}, filteredArgs...)

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

	validRecords, invalidLines := parseInput(lines)
	fmt.Fprintf(os.Stderr, "Valid lines: %d, Invalid lines: %d\n", len(validRecords), len(invalidLines))

	groups, err := parsePrefixes(*prefixes)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(1)
	}
	matchRecords(validRecords, groups)

	report := generateReport(groups, *showDetails, invalidLines)

	outPath, err := resolveOutputPath(*output)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(2)
	}

	if err := os.WriteFile(outPath, []byte(report), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: failed to write output: %v\n", err)
		os.Exit(2)
	}

	fmt.Fprintf(os.Stderr, "Report written to: %s\n", outPath)
	fmt.Printf(`{"status":"ok","output":"报告已生成至 %s"}`, outPath)
	fmt.Println()
}

func outputSchema() {
	schema := map[string]interface{}{
		"title":              "Phone Filter",
		"title_zh":           "电话号码筛选统计",
		"description":        "Parse 11-digit phone numbers with 有/无 tags, filter by prefix, and generate statistical reports.",
		"description_zh":     "解析11位电话号码及有/无标记，按号段前缀筛选并生成统计报告。",
		"long_description":   "Reads a text file (or stdin) containing lines in the format '11-digit-number----有/无', filters by user-specified number prefixes, counts by 有/无 for each prefix group, calculates percentages, and outputs a structured report. Optionally includes detailed matched lines. Invalid lines are reported at the end.",
		"long_description_zh": "读取包含「11位号码----有/无」格式行的文本文件（或标准输入），按用户指定的号段前缀进行筛选，分别统计每个前缀组中有/无的数量和占比，输出结构化报告。可选择性包含匹配的详细数据行。不符合格式的行将在报告末尾汇总提醒。",
		"type": "object",
		"properties": map[string]interface{}{
			"input-file": map[string]interface{}{
				"type":           "string",
				"description":    "Input text file path (leave empty to read from stdin)",
				"description_zh": "输入文本文件路径（留空则从标准输入读取）",
				"format":         "file-path",
			},
			"prefixes": map[string]interface{}{
				"type":           "string",
				"description":    "Semicolon-separated number prefixes; empty segment = full dataset. E.g. ';138;139;'",
				"description_zh": "分号分隔的号码前缀；空段 = 全量数据。例：';138;139;'",
				"default":        ";",
			},
			"show-details": map[string]interface{}{
				"type":           "boolean",
				"description":    "Include matched detail lines in the report",
				"description_zh": "在报告中包含匹配的详细数据行",
				"default":        false,
			},
			"output": map[string]interface{}{
				"type":           "string",
				"description":    "Output path: directory → auto-named timestamp file; .txt file → overwrite",
				"description_zh": "输出路径：目录 → 自动生成时间戳文件；.txt 文件 → 直接覆盖",
				"format":         "directory-path",
			},
		},
		"required": []string{"output"},
		"x-steps": []map[string]interface{}{
			{
				"title":    "Step 1: Select Files",
				"title_zh": "步骤 1：选择文件",
				"fields":   []string{"input-file", "output"},
			},
			{
				"title":    "Step 2: Filter Options",
				"title_zh": "步骤 2：筛选选项",
				"fields":   []string{"prefixes", "show-details"},
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

// filterLangFlag removes --lang and -lang flags (and their values) injected by CLI Hub
func filterLangFlag(args []string) []string {
	var filtered []string
	for i := 0; i < len(args); i++ {
		a := args[i]
		if a == "--lang" || a == "-lang" {
			if i+1 < len(args) && !strings.HasPrefix(args[i+1], "-") {
				i++ // skip value
			}
			continue
		}
		if strings.HasPrefix(a, "--lang=") || strings.HasPrefix(a, "-lang=") {
			continue
		}
		filtered = append(filtered, a)
	}
	return filtered
}

var linePattern = regexp.MustCompile(`^(\d{11})----(有|无)$`)

type PhoneRecord struct {
	Number string
	Status string // "有" or "无"
}

type PrefixGroup struct {
	Prefix    string // the prefix string, or "" for full-data
	Label     string // display label: prefix string or "全量数据"
	Records   []PhoneRecord
	HaveCount int
	NotCount  int
}

func parseInput(lines []string) ([]PhoneRecord, []string) {
	var records []PhoneRecord
	var invalidLines []string

	for _, line := range lines {
		m := linePattern.FindStringSubmatch(line)
		if m != nil {
			records = append(records, PhoneRecord{Number: m[1], Status: m[2]})
		} else {
			invalidLines = append(invalidLines, line)
		}
	}
	return records, invalidLines
}

func parsePrefixes(raw string) ([]PrefixGroup, error) {
	segments := strings.Split(raw, ";")
	// Drop trailing empty segment from final terminator ";"
	if len(segments) > 0 && segments[len(segments)-1] == "" {
		segments = segments[:len(segments)-1]
	}
	var groups []PrefixGroup

	for _, seg := range segments {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			groups = append(groups, PrefixGroup{Prefix: "", Label: "全量数据"})
			continue
		}
		// Validate: must be all digits, max 11
		for _, c := range seg {
			if c < '0' || c > '9' {
				return nil, fmt.Errorf("invalid prefix '%s': contains non-digit character", seg)
			}
		}
		if len(seg) > 11 {
			return nil, fmt.Errorf("invalid prefix '%s': exceeds 11 digits", seg)
		}
		groups = append(groups, PrefixGroup{Prefix: seg, Label: seg})
	}
	return groups, nil
}

func matchRecords(records []PhoneRecord, groups []PrefixGroup) {
	for i := range groups {
		g := &groups[i]
		if g.Prefix == "" {
			// Full data — match all
			g.Records = records
		} else {
			for _, r := range records {
				if strings.HasPrefix(r.Number, g.Prefix) {
					g.Records = append(g.Records, r)
				}
			}
		}
		// Count
		for _, r := range g.Records {
			if r.Status == "有" {
				g.HaveCount++
			} else {
				g.NotCount++
			}
		}
	}
}

func generateReport(groups []PrefixGroup, showDetails bool, invalidLines []string) string {
	var b strings.Builder

	sepLine := "--------------------------------------------------------------------------------------------------------------------------------------------------------------------------"

	for i, g := range groups {
		if i > 0 {
			b.WriteString(sepLine + "\n")
		}

		total := len(g.Records)

		b.WriteString(sepLine + "\n\n")
		b.WriteString(fmt.Sprintf(">>>>开始>>>>%s\n\n", g.Label))

		// 有 count
		b.WriteString(fmt.Sprintf("%s----有  =  %d  (个)\n", g.Label, g.HaveCount))
		if showDetails {
			for _, r := range g.Records {
				if r.Status == "有" {
					b.WriteString(fmt.Sprintf("* %s----有\n", r.Number))
				}
			}
		}

		// 无 count
		b.WriteString(fmt.Sprintf("%s----无  =  %d  (个)\n", g.Label, g.NotCount))
		if showDetails {
			for _, r := range g.Records {
				if r.Status == "无" {
					b.WriteString(fmt.Sprintf("* %s----无\n", r.Number))
				}
			}
		}

		// Percentages
		havePct := 0.0
		notPct := 0.0
		if total > 0 {
			havePct = float64(g.HaveCount) / float64(total) * 100
			notPct = float64(g.NotCount) / float64(total) * 100
		}
		b.WriteString(fmt.Sprintf("\n%s----有  =  占比为 %.2f%%\n", g.Label, havePct))
		b.WriteString(fmt.Sprintf("%s----无  =  占比为 %.2f%%\n", g.Label, notPct))

		b.WriteString(fmt.Sprintf("\n<<<<结束<<<<%s\n", g.Label))
	}

	// Data quality reminder
	if len(invalidLines) > 0 {
		b.WriteString("\n========== 数据质量提醒 ==========\n")
		b.WriteString(fmt.Sprintf("以下 %d 行不符合 `11位数字----有/无` 格式，已忽略：\n", len(invalidLines)))
		for _, line := range invalidLines {
			b.WriteString(fmt.Sprintf("* %s\n", line))
		}
	}

	return b.String()
}

func resolveOutputPath(output string) (string, error) {
	// If path ends with .txt, treat as a specific file — use directly
	if strings.HasSuffix(output, ".txt") {
		return output, nil
	}
	// Treat as directory — create if needed, then generate timestamped filename
	if err := os.MkdirAll(output, 0755); err != nil {
		return "", fmt.Errorf("failed to create output directory: %w", err)
	}
	filename := time.Now().Format("20060102150405") + ".txt"
	return filepath.Join(output, filename), nil
}
