//go:build ignore

package main

import (
	"fmt"
	"log"

	"github.com/xuri/excelize/v2"
)

func main() {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	sheet := "Sheet1"
	// 表头
	if err := f.SetCellValue(sheet, "A1", "号段"); err != nil {
		log.Fatal(err)
	}
	if err := f.SetCellValue(sheet, "B1", "号码"); err != nil {
		log.Fatal(err)
	}

	segments := []string{"138", "139", "150", "186", "189"}
	row := 2
	for _, seg := range segments {
		for i := 1; i <= 300; i++ {
			num := fmt.Sprintf("%s%08d", seg, i)
			if err := f.SetCellValue(sheet, fmt.Sprintf("A%d", row), seg); err != nil {
				log.Fatal(err)
			}
			if err := f.SetCellValue(sheet, fmt.Sprintf("B%d", row), num); err != nil {
				log.Fatal(err)
			}
			row++
		}
	}

	if err := f.SaveAs("test-data.xlsx"); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Generated test-data.xlsx with %d rows\n", row-2)
}
