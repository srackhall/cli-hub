//go:build ignore

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	appDir := "."
	
	store, err := NewSettingsStore(appDir)
	if err != nil {
		fmt.Println("FATAL: NewSettingsStore failed:", err)
		os.Exit(1)
	}

	toolsDir := store.GetToolsDir()
	fmt.Println("=== GetToolsDir() returns:", toolsDir)
	
	absToolsDir, _ := filepath.Abs(toolsDir)
	fmt.Println("=== Absolute tools dir:", absToolsDir)
	
	entries, err := os.ReadDir(toolsDir)
	if err != nil {
		fmt.Println("ERROR reading tools dir:", err)
	} else {
		fmt.Printf("=== Tools dir has %d entries:\n", len(entries))
		for _, e := range entries {
			info, _ := e.Info()
			fmt.Printf("    %s (isDir=%v, mode=%v, executable=%v)\n", 
				e.Name(), e.IsDir(), info.Mode(), info.Mode()&0111 != 0)
		}
	}
	
	app := &App{settings: store}
	tools := app.ListTools()
	fmt.Printf("\n=== ListTools() returned %d tools:\n", len(tools))
	for i, t := range tools {
		data, _ := json.MarshalIndent(t, "", "  ")
		fmt.Printf("  [%d] %s\n", i, string(data))
	}
	
	if len(tools) == 0 {
		fmt.Println("\n*** BUG: ListTools returned empty, but tools dir has files! ***")
		os.Exit(1)
	}
	
	fmt.Println("\n=== Testing ImportTool flow ===")
	sourcePath := "./tools/xlsx-extract/xlsx-extract"
	if _, err := os.Stat(sourcePath); err == nil {
		err := app.ImportTool(sourcePath)
		if err != nil {
			fmt.Println("ImportTool error:", err)
		} else {
			fmt.Println("ImportTool succeeded")
		}
	}
	
	tools2 := app.ListTools()
	fmt.Printf("After import: %d tools\n", len(tools2))
	for _, t := range tools2 {
		fmt.Printf("  - %s (ready=%v)\n", t.Name, t.Ready)
	}
}
