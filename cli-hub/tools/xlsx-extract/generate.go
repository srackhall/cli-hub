package main

import (
	"fmt"
	"math/rand"
	"os"

	"github.com/xuri/excelize/v2"
)

// Generates a sample test file for xlsx-extract.
// Creates 5 segments (138, 139, 150, 186, 189) with ~250-300 numbers each,
// so you can test the --limit and --shuffle flags.

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: go run generate_test.go <output.xlsx>")
		os.Exit(1)
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Sheet1"

	// Header
	f.SetCellValue(sheet, "A1", "segment")
	f.SetCellValue(sheet, "B1", "number")

	segments := []string{"138", "139", "150", "186", "189"}
	rng := rand.New(rand.NewSource(42)) // deterministic seed

	row := 2
	for _, seg := range segments {
		count := 250 + rng.Intn(51) // 250-300 numbers per segment
		for i := 0; i < count; i++ {
			aCell := fmt.Sprintf("A%d", row)
			bCell := fmt.Sprintf("B%d", row)

			// Generate a realistic-looking phone number: seg + 8 random digits
			number := fmt.Sprintf("%s%08d", seg, rng.Intn(100000000))

			f.SetCellValue(sheet, aCell, seg)
			f.SetCellValue(sheet, bCell, number)
			row++
		}
	}

	output := os.Args[1]
	if err := f.SaveAs(output); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to save: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Generated test file: %s (%d rows, %d data rows)\n", output, row-1, row-2)
}
