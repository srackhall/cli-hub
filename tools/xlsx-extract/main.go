package main

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

var lang = "zh"

var msgs = map[string]map[string]string{
	"usage":             {"zh": "用法: xlsx-extract --schema|--version|--lang=zh|en|<params>", "en": "Usage: xlsx-extract --schema|--version|--lang=zh|en|<params>"},
	"input_required":    {"zh": "错误: --input 是必需的", "en": "ERROR: --input is required"},
	"file_not_found":    {"zh": "错误: 输入文件未找到: %s", "en": "ERROR: input file not found: %s"},
	"open_failed":       {"zh": "错误: 无法打开文件: %v", "en": "ERROR: failed to open file: %v"},
	"read_failed":       {"zh": "错误: 无法读取工作表: %v", "en": "ERROR: failed to read sheet: %v"},
	"no_data":           {"zh": "错误: 工作表没有数据行", "en": "ERROR: sheet has no data rows"},
	"no_data_columns":   {"zh": "错误: 指定列中没有找到数据", "en": "ERROR: no data found in specified columns"},
	"write_failed":      {"zh": "错误: 无法写入输出文件: %v", "en": "ERROR: failed to write output: %v"},
	"mkdir_failed":     {"zh": "错误: 无法创建输出目录: %v", "en": "ERROR: failed to create output directory: %v"},
	"segment_progress":  {"zh": "号段 %s: 已提取 %d/%d", "en": "Segment %s: extracted %d/%d"},
	"done":              {"zh": "完成: %d 个值从 %d 个号段写入 %s", "en": "Done: %d values from %d segments written to %s"},
	"result_summary":    {"zh": "%d 个值来自 %d 个号段", "en": "%d values from %d segments"},
}

func msg(key string, args ...any) string {
	if m, ok := msgs[key]; ok {
		if s, ok := m[lang]; ok {
			if len(args) > 0 {
				return fmt.Sprintf(s, args...)
			}
			return s
		}
	}
	if len(args) > 0 {
		return fmt.Sprintf(key, args...)
	}
	return key
}

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, msg("usage"))
		os.Exit(1)
	}

	// Parse --lang before anything else
	for _, a := range os.Args[1:] {
		if strings.HasPrefix(a, "--lang=") {
			v := strings.TrimPrefix(a, "--lang=")
			if v == "en" {
				lang = "en"
			}
			break
		}
	}

	firstArg := os.Args[1]
	// If first arg is --lang=..., skip to the next meaningful arg
	if strings.HasPrefix(firstArg, "--lang=") {
		if len(os.Args) < 3 {
			fmt.Fprintln(os.Stderr, msg("usage"))
			os.Exit(1)
		}
		firstArg = os.Args[2]
	}

	switch firstArg {
	case "--schema":
		b, _ := json.MarshalIndent(getSchema(), "", "  ")
		fmt.Println(string(b))
	case "--version":
		fmt.Println("xlsx-extract v1.0.0 (protocol v1)")
	default:
		run()
	}
}

func getSchema() map[string]any {
	return map[string]any{
		"title":              "XLSX Extract",
		"title_zh":           "XLSX 号码提取",
		"description":        "Extract values from one Excel column grouped by another column, with configurable limit per group.",
		"description_zh":     "按指定列分组提取另一列的值，可配置每组提取数量，支持随机或顺序选取。",
		"long_description":   "Reads an Excel (.xlsx) file and groups rows by a key column (e.g. column A for segments). For each group, extracts up to N values from a value column (e.g. column B for phone numbers). Results are written to a text file, one value per line. Supports optional random shuffling within each group for unbiased sampling.",
		"long_description_zh": "读取 Excel (.xlsx) 文件，按号段列（如 A 列）分组，从号码列（如 B 列）中为每个号段提取最多 N 个号码。结果按每行一个写入文本文件。支持可选随机抽取，避免顺序偏差。适用于号段号码分配、抽样提取等场景。",
		"type":               "object",
		"properties": map[string]any{
			"input": map[string]any{
				"type":           "string",
				"description":    "Input Excel file path (.xlsx)",
				"description_zh": "输入 Excel 文件路径 (.xlsx)",
				"format":         "file-path",
			},
			"output": map[string]any{
				"type":        "string",
				"description": "Output file or directory path. If a directory, a timestamped .txt file is created inside (e.g. 20260602-143025.txt).",
				"description_zh": "输出文件或目录路径。若为目录则自动生成时间戳 .txt 文件（如 20260602-143025.txt）。",
				"format":      "file-path",
			},
			"key-col": map[string]any{
				"type":           "string",
				"description":    "Grouping column — letter (A/B/C) or number (1/2/3). Col A = 1st column, B = 2nd, etc.",
				"description_zh": "号段列 — 字母（A/B/C）或数字（1/2/3）。A列=第1列，B列=第2列，以此类推",
				"default":        "A",
			},
			"val-col": map[string]any{
				"type":           "string",
				"description":    "Value column — letter (A/B/C) or number (1/2/3). Col A = 1st column, B = 2nd, etc.",
				"description_zh": "号码列 — 字母（A/B/C）或数字（1/2/3）。A列=第1列，B列=第2列，以此类推",
				"default":        "B",
			},
			"limit": map[string]any{
				"type":           "integer",
				"description":    "Max values to extract per group",
				"description_zh": "每组最多提取数量",
				"default":        200,
				"minimum":        1,
				"maximum":        100000,
			},
			"shuffle": map[string]any{
				"type":           "boolean",
				"description":    "Randomize selection within each group",
				"description_zh": "每组内随机抽取",
				"default":        false,
			},
		},
		"required": []string{"input"},
		"x-steps": []map[string]any{
			{
				"title":    "Step 1: Input & Output",
				"title_zh": "步骤 1：输入输出",
				"fields":   []string{"input", "output"},
			},
			{
				"title":    "Step 2: Extraction Rules",
				"title_zh": "步骤 2：提取规则",
				"fields":   []string{"key-col", "val-col", "limit", "shuffle"},
			},
		},
	}
}

func run() {
	args := parseArgs(os.Args[1:])

	if args["input"] == "" {
		fmt.Fprintln(os.Stderr, msg("input_required"))
		os.Exit(1)
	}

	if _, err := os.Stat(args["input"]); os.IsNotExist(err) {
		fmt.Fprintf(os.Stderr, msg("file_not_found", args["input"])+"\n")
		os.Exit(2)
	}

	f, err := excelize.OpenFile(args["input"])
	if err != nil {
		fmt.Fprintf(os.Stderr, msg("open_failed", err)+"\n")
		os.Exit(2)
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		fmt.Fprintf(os.Stderr, msg("read_failed", err)+"\n")
		os.Exit(2)
	}

	if len(rows) < 2 {
		fmt.Fprintln(os.Stderr, msg("no_data"))
		os.Exit(2)
	}

	groupMap := make(map[string][]string)

	keyCol := normalizeCol(args["key-col"], "A")
	valCol := normalizeCol(args["val-col"], "B")

	for i := 1; i < len(rows); i++ {
		keyCell, err1 := f.GetCellValue(sheet, fmt.Sprintf("%s%d", keyCol, i+1))
		valCell, err2 := f.GetCellValue(sheet, fmt.Sprintf("%s%d", valCol, i+1))
		if err1 != nil || err2 != nil {
			continue
		}
		keyCell = strings.TrimSpace(keyCell)
		valCell = strings.TrimSpace(valCell)
		if keyCell == "" || valCell == "" {
			continue
		}
		groupMap[keyCell] = append(groupMap[keyCell], valCell)
	}

	if len(groupMap) == 0 {
		fmt.Fprintln(os.Stderr, msg("no_data_columns"))
		os.Exit(2)
	}

	rng := rand.New(rand.NewSource(rand.Int63()))

	segments := make([]string, 0, len(groupMap))
	for seg := range groupMap {
		segments = append(segments, seg)
	}
	sort.Strings(segments)

	var result []string
	totalExtracted := 0

	limit := parseIntArg(args["limit"], 200)
	shuffle := args["shuffle"] == "true"

	for _, segment := range segments {
		numbers := groupMap[segment]

		if shuffle {
			rng.Shuffle(len(numbers), func(i, j int) {
				numbers[i], numbers[j] = numbers[j], numbers[i]
			})
		}

		n := limit
		if len(numbers) < n {
			n = len(numbers)
		}

		fmt.Println(msg("segment_progress", segment, n, len(numbers)))

		for i := 0; i < n; i++ {
			result = append(result, numbers[i])
		}
		totalExtracted += n
	}

	var sb strings.Builder
	for _, v := range result {
		sb.WriteString(v)
		sb.WriteByte('\n')
	}

	outputFile := args["output"]
	if outputFile == "" {
		outputFile = "output.txt"
	}

	// Smart path resolution
	if info, err := os.Stat(outputFile); err == nil && info.IsDir() {
		ts := time.Now().Format("20060102-150405.000")
		outputFile = filepath.Join(outputFile, ts+".txt")
	} else if err != nil {
		// Path doesn't exist — ensure parent directory exists
		if dir := filepath.Dir(outputFile); dir != "." {
			if err := os.MkdirAll(dir, 0755); err != nil {
				fmt.Fprintf(os.Stderr, msg("mkdir_failed", err)+"\n")
				os.Exit(2)
			}
		}
	}
	// else: path exists and is a file — overwrite directly

	if err := os.WriteFile(outputFile, []byte(sb.String()), 0644); err != nil {
		fmt.Fprintf(os.Stderr, msg("write_failed", err)+"\n")
		os.Exit(2)
	}

	fmt.Println(msg("done", totalExtracted, len(segments), outputFile))
	fmt.Printf(`{"status":"ok","output":"%s"}`+"\n", msg("result_summary", totalExtracted, len(segments)))
}

// normalizeCol accepts a column spec that may be a letter (A-Z, AA-ZZ, case-insensitive)
// or a 1-based number ("1" = column A, "2" = B, etc.). Returns the uppercase letter form.
func normalizeCol(raw string, defaultCol string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultCol
	}
	// Try as number first
	if n, err := strconv.Atoi(raw); err == nil && n >= 1 {
		return colNumToLetter(n)
	}
	// Treat as letter — uppercase it
	return strings.ToUpper(raw)
}

// colNumToLetter converts 1→A, 2→B, …, 26→Z, 27→AA, etc.
func colNumToLetter(n int) string {
	var s string
	for n > 0 {
		n--
		s = string(rune('A'+n%26)) + s
		n /= 26
	}
	return s
}

// parseArgs converts ["--key", "val", "--flag"] into map["key"]="val", map["flag"]="true".
// Skips --lang and --lang=... arguments.
func parseArgs(raw []string) map[string]string {
	m := map[string]string{}
	for i := 0; i < len(raw); i++ {
		a := raw[i]
		// Skip --lang=... and --lang <value>
		if strings.HasPrefix(a, "--lang=") || a == "--lang" {
			if a == "--lang" && i+1 < len(raw) {
				i++ // skip value
			}
			continue
		}
		if !strings.HasPrefix(a, "--") {
			continue
		}
		key := strings.TrimPrefix(a, "--")
		if i+1 < len(raw) && !strings.HasPrefix(raw[i+1], "--") {
			m[key] = raw[i+1]
			i++
		} else {
			m[key] = "true"
		}
	}
	return m
}

func parseIntArg(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return v
}
