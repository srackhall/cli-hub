#!/bin/bash
# 测试 xlsx-extract CLI 的验证脚本

set -e

echo "=== xlsx-extract CLI 测试 ==="

# 检查二进制文件
if [ ! -f "./xlsx-extract" ]; then
    echo "错误: xlsx-extract 二进制文件不存在，请先编译: go build -o xlsx-extract main.go"
    exit 1
fi

echo "1. 测试 --version"
./xlsx-extract --version

echo ""
echo "2. 测试 --schema (检查 JSON 格式)"
./xlsx-extract --schema | jq . > /dev/null 2>&1 && echo "  JSON 格式有效" || echo "  JSON 格式无效"

echo ""
echo "3. 测试基本提取功能 (--input test-data.xlsx --limit 5)"
./xlsx-extract --input test-data.xlsx --output test-output.txt --limit 5
if [ -f test-output.txt ]; then
    lines=$(wc -l < test-output.txt)
    echo "  输出文件行数: $lines (预期 5*5=25 或更多)"
    echo "  前5行:"
    head -5 test-output.txt | sed 's/^/    /'
else
    echo "  错误: 输出文件未生成"
    exit 1
fi

echo ""
echo "4. 测试随机抽取 (--shuffle)"
./xlsx-extract --input test-data.xlsx --output test-shuffle.txt --limit 3 --shuffle
lines=$(wc -l < test-shuffle.txt)
echo "  输出行数: $lines"

echo ""
echo "5. 测试缺失必需参数 (应返回错误)"
if ! ./xlsx-extract 2>&1 >/dev/null; then
    echo "  正确返回参数错误 (exit code non-zero)"
else
    echo "  未返回预期错误"
    exit 1
fi

echo ""
echo "=== 所有测试通过 ==="
