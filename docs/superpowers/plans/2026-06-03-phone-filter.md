# phone-filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Go CLI tool (`phone-filter`) that parses `11-digit----有/无` formatted text, filters by phone number prefixes, and generates structured reports.

**Architecture:** Single-file Go CLI using only standard library (`flag`, `fmt`, `os`, `regexp`, `strings`, `time`, `encoding/json`). Reads from file or stdin, processes lines via regex, groups by user-specified prefixes, outputs a formatted report to a file.

**Tech Stack:** Go 1.21+, zero external dependencies, Makefile for cross-compilation

---

### Task 1: Create project scaffold

**Files:**
- Create: `phone-filter/main.go`
- Create: `phone-filter/Makefile`

- [ ] **Step 1: Create directory and empty files**

```bash
mkdir -p phone-filter
touch phone-filter/main.go
touch phone-filter/Makefile
```

- [ ] **Step 2: Initialize Go module**

```bash
cd phone-filter && go mod init phone-filter
```

Expected output: `go: creating new go.mod: module phone-filter`

- [ ] **Step 3: Commit**

```bash
git add phone-filter/
git commit -m "chore: scaffold phone-filter project"
```

---

### Task 2: Write main.go — flag definitions, main function skeleton, --schema, --version

**Files:**
- Modify: `phone-filter/main.go` (full content)

- [ ] **Step 1: Write the full main.go**

```go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
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

	// TODO: main logic — will be filled in subsequent tasks
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
```

- [ ] **Step 2: Verify --version works**

```bash
cd phone-filter && go run . --version
```

Expected output: `phone-filter v0.1.0 (protocol v1)`

- [ ] **Step 3: Verify --schema outputs valid JSON**

```bash
cd phone-filter && go run . --schema | python3 -m json.tool > /dev/null && echo "VALID"
```

Expected: `VALID`

- [ ] **Step 4: Verify --output validation error**

```bash
cd phone-filter && go run . 2>&1; echo "EXIT: $?"
```

Expected: `ERROR: --output is required` + exit code 1

- [ ] **Step 5: Commit**

```bash
git add phone-filter/main.go
git commit -m "feat(phone-filter): add flag definitions, --schema, --version"
```

---

### Task 3: Implement input reading (file or stdin)

**Files:**
- Modify: `phone-filter/main.go`

- [ ] **Step 1: Replace the main function with input reading logic**

In `main()`, after the `--output` validation check, add:

```go
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
```

Also add the missing imports (`io`, `strings`) and the helper:

```go
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
```

- [ ] **Step 2: Create a test input file and verify**

```bash
printf '13800138000----有\n13900139000----无\nsome random junk\n' > /tmp/phone-filter-test.txt
cd phone-filter && go run . --input-file /tmp/phone-filter-test.txt --output /tmp 2>&1
```

Expected stderr: `Read 3 lines from input.` (or similar; no crash)

- [ ] **Step 3: Verify stdin input**

```bash
echo '13800138000----有' | go run . --output /tmp 2>&1
```

Expected stderr: `Read 1 lines from input.`

- [ ] **Step 4: Commit**

```bash
git add phone-filter/main.go
git commit -m "feat(phone-filter): add input reading from file or stdin"
```

---

### Task 4: Implement line parsing and prefix matching

**Files:**
- Modify: `phone-filter/main.go`

- [ ] **Step 1: Add the regex pattern, data structures, and parsing functions**

Add `regexp` to imports, then after `splitLines`:

```go
var linePattern = regexp.MustCompile(`^(\d{11})----(有|无)$`)

type PhoneRecord struct {
	Number string
	Status string // "有" or "无"
}

type PrefixGroup struct {
	Prefix   string // the prefix string, or "" for full-data
	Label    string // display label: prefix string or "全量数据"
	Records  []PhoneRecord
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
```

- [ ] **Step 2: Verify parsing with a quick test**

Add temporary debug code in `main()` after parsing:

```go
	validRecords, invalidLines := parseInput(lines)
	fmt.Fprintf(os.Stderr, "Valid lines: %d, Invalid lines: %d\n", len(validRecords), len(invalidLines))

	groups, err := parsePrefixes(*prefixes)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(1)
	}
	matchRecords(validRecords, groups)

	for _, g := range groups {
		fmt.Fprintf(os.Stderr, "[%s] 有=%d 无=%d total=%d\n", g.Label, g.HaveCount, g.NotCount, len(g.Records))
	}
```

Test:

```bash
printf '13800138000----有\n13800138001----无\n13900139000----有\njunk line\n' > /tmp/phone-filter-test.txt
cd phone-filter && go run . --input-file /tmp/phone-filter-test.txt --output /tmp --prefixes ';138;' 2>&1
```

Expected stderr lines (order may vary):
```
Read 4 lines from input.
Valid lines: 3, Invalid lines: 1
[全量数据] 有=2 无=1 total=3
[138] 有=1 无=1 total=2
```

- [ ] **Step 3: Commit**

```bash
git add phone-filter/main.go
git commit -m "feat(phone-filter): add line parsing and prefix matching"
```

---

### Task 5: Implement report generation and file output

**Files:**
- Modify: `phone-filter/main.go`

- [ ] **Step 1: Add report generation functions**

Add after `matchRecords`:

```go
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
	info, err := os.Stat(output)
	if err == nil && !info.IsDir() {
		// It's a file — use directly
		return output, nil
	}
	// It's a directory (or doesn't exist — treat as dir and create)
	if err != nil {
		if err2 := os.MkdirAll(output, 0755); err2 != nil {
			return "", fmt.Errorf("failed to create output directory: %w", err2)
		}
	}
	filename := time.Now().Format("20060102150405") + ".txt"
	return output + "/" + filename, nil
}
```

Add `time` to imports.

- [ ] **Step 2: Replace main() debug code with actual report output**

Replace the debug printing code (the `fmt.Fprintf` loops) in `main()` with:

```go
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
```

- [ ] **Step 3: Full integration test**

```bash
printf '13800138000----有
13800138001----无
13900139000----有
this is junk
13800138002----无
' > /tmp/phone-filter-test.txt

cd phone-filter && go run . \
  --input-file /tmp/phone-filter-test.txt \
  --output /tmp \
  --prefixes ';138;' \
  --show-details 2>&1
```

Check the generated report file in `/tmp/` (named like `20260603143052.txt`) contains:
- Two axis blocks (全量数据 and 138)
- Detail lines under each
- Data quality reminder at end with 1 invalid line

- [ ] **Step 4: Test without --show-details**

```bash
go run . --input-file /tmp/phone-filter-test.txt --output /tmp --prefixes ';' 2>&1
```

Verify the report has no `* xxxxxxxxxxx----有` detail lines.

- [ ] **Step 5: Test output to a specific file**

```bash
go run . --input-file /tmp/phone-filter-test.txt --output /tmp/phone-filter-report.txt --prefixes ';' 2>&1
cat /tmp/phone-filter-report.txt | head -5
```

- [ ] **Step 6: Commit**

```bash
git add phone-filter/main.go
git commit -m "feat(phone-filter): add report generation and file output"
```

---

### Task 6: Write Makefile

**Files:**
- Modify: `phone-filter/Makefile`

- [ ] **Step 1: Write Makefile**

```makefile
BINARY  = phone-filter

TARGETS = darwin-amd64 darwin-arm64 linux-amd64 linux-arm64 windows-amd64 windows-arm64

# make build — compile for current platform, output to current directory
.PHONY: build
build:
	go build -o $(BINARY) .

# make build-all — cross-compile all 6 platforms to bin/<os>-<arch>/
.PHONY: build-all
build-all:
	@for t in $(TARGETS); do \
		os=$$(echo $$t | cut -d- -f1); \
		arch=$$(echo $$t | cut -d- -f2); \
		out="bin/$$t/$(BINARY)"; \
		[ "$$os" = "windows" ] && out="$$out.exe"; \
		echo "→ $$t"; \
		GOOS=$$os GOARCH=$$arch CGO_ENABLED=0 go build -o "$$out" . ; \
	done

# make clean — remove bin/ and local binary
.PHONY: clean
clean:
	rm -rf bin $(BINARY)
```

- [ ] **Step 2: Verify Makefile build**

```bash
cd phone-filter && make build
```

Expected: compiles `phone-filter` binary in current directory, no errors.

- [ ] **Step 3: Verify cross-compile**

```bash
cd phone-filter && make build-all
ls -la bin/*/
```

Expected: 6 subdirectories under `bin/`, each containing `phone-filter` (or `phone-filter.exe` for Windows).

- [ ] **Step 4: Clean up and verify final binary**

```bash
cd phone-filter && make clean && make build
./phone-filter --version
./phone-filter --schema | python3 -c "import sys,json; json.load(sys.stdin); print('OK')"
```

Expected:
- `phone-filter v0.1.0 (protocol v1)`
- `OK`

- [ ] **Step 5: Commit**

```bash
git add phone-filter/Makefile
git commit -m "feat(phone-filter): add Makefile for cross-platform build"
```

---

### Task 7: Final end-to-end validation

**Files:**
- None (test only)

- [ ] **Step 1: Create comprehensive test data**

```bash
cat > /tmp/phone-filter-full-test.txt << 'EOF'
13800138000----有
13800138001----有
13800138002----无
13900139000----有
13900139001----无
13900139002----无
  13800138003----有  
this is not a valid line
another junk line
13800138004----未知
13800138005----
EOF
```

- [ ] **Step 2: Run with all features enabled**

```bash
cd phone-filter && ./phone-filter \
  --input-file /tmp/phone-filter-full-test.txt \
  --output /tmp/phone-filter-report.txt \
  --prefixes ';138;139;' \
  --show-details
```

- [ ] **Step 3: Verify report content**

```bash
cat /tmp/phone-filter-report.txt
```

Expected:
- Block 1: 全量数据 — 有=4, 无=3, 占比 57.14% / 42.86%
- Block 2: 138 — 有=3, 无=1, 占比 75.00% / 25.00%
- Block 3: 139 — 有=1, 无=2, 占比 33.33% / 66.67%
- Detail lines shown for each
- Data quality reminder with 3 invalid lines (junk line, another junk line, 13800138005----)

- [ ] **Step 4: Verify stdout JSON**

```bash
./phone-filter --input-file /tmp/phone-filter-full-test.txt --output /tmp --prefixes ';' 2>/dev/null | tail -1
```

Expected: `{"status":"ok","output":"报告已生成至 /tmp/2026..."}`

- [ ] **Step 5: Test error cases**

```bash
# Missing --output
./phone-filter 2>&1; echo "EXIT: $?"
# Expected: ERROR + exit 1

# Invalid prefix
./phone-filter --output /tmp --prefixes 'abc' 2>&1; echo "EXIT: $?"
# Expected: ERROR: invalid prefix + exit 1

# Prefix > 11 digits
./phone-filter --output /tmp --prefixes '123456789012' 2>&1; echo "EXIT: $?"
# Expected: ERROR: invalid prefix + exit 1

# Non-existent input file
./phone-filter --input-file /nonexistent --output /tmp 2>&1; echo "EXIT: $?"
# Expected: ERROR + exit 2
```

- [ ] **Step 6: Commit final state**

```bash
git status
# Should show clean working tree
```

---

### Complete main.go (reference)

For reference, the final `main.go` after all tasks should look like:

```go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"
	"time"
)

var linePattern = regexp.MustCompile(`^(\d{11})----(有|无)$`)

type PhoneRecord struct {
	Number string
	Status string
}

type PrefixGroup struct {
	Prefix    string
	Label     string
	Records   []PhoneRecord
	HaveCount int
	NotCount  int
}

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

	if *output == "" {
		fmt.Fprintln(os.Stderr, "ERROR: --output is required")
		os.Exit(1)
	}

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
	var groups []PrefixGroup

	for _, seg := range segments {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			groups = append(groups, PrefixGroup{Prefix: "", Label: "全量数据"})
			continue
		}
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
			g.Records = records
		} else {
			for _, r := range records {
				if strings.HasPrefix(r.Number, g.Prefix) {
					g.Records = append(g.Records, r)
				}
			}
		}
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

		b.WriteString(fmt.Sprintf("%s----有  =  %d  (个)\n", g.Label, g.HaveCount))
		if showDetails {
			for _, r := range g.Records {
				if r.Status == "有" {
					b.WriteString(fmt.Sprintf("* %s----有\n", r.Number))
				}
			}
		}

		b.WriteString(fmt.Sprintf("%s----无  =  %d  (个)\n", g.Label, g.NotCount))
		if showDetails {
			for _, r := range g.Records {
				if r.Status == "无" {
					b.WriteString(fmt.Sprintf("* %s----无\n", r.Number))
				}
			}
		}

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
	info, err := os.Stat(output)
	if err == nil && !info.IsDir() {
		return output, nil
	}
	if err != nil {
		if err2 := os.MkdirAll(output, 0755); err2 != nil {
			return "", fmt.Errorf("failed to create output directory: %w", err2)
		}
	}
	filename := time.Now().Format("20060102150405") + ".txt"
	return output + "/" + filename, nil
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
```
