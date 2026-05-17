package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

// App represents the Wails application with bindings.
type App struct {
	settings *SettingsStore
}

// ListTools scans and returns all available CLI tools.
func (a *App) ListTools() []ToolInfo {
	return ScanTools(a.settings.GetToolsDir())
}

// GetSchema returns the JSON Schema for a tool.
func (a *App) GetSchema(name string) *ToolSchema {
	if !validateToolName(name) {
		return nil
	}
	toolPath := a.settings.GetToolsDir() + "/" + name
	schema, err := getToolSchema(toolPath)
	if err != nil {
		return nil
	}
	return schema
}

// RefreshTools forces a rescan of the tools directory.
func (a *App) RefreshTools() {
	ScanTools(a.settings.GetToolsDir())
}

// GetSettings returns the current application settings.
func (a *App) GetSettings() AppSettings {
	return a.settings.Get()
}

// UpdateSettings persists new application settings and creates cli dir if needed.
func (a *App) UpdateSettings(newSettings AppSettings) {
	a.settings.Update(newSettings)
}

// ImportTool copies a CLI binary from sourcePath into the tools directory.
func (a *App) ImportTool(sourcePath string) error {
	toolsDir := a.settings.GetToolsDir()
	if err := os.MkdirAll(toolsDir, 0755); err != nil {
		return fmt.Errorf("failed to create tools directory: %w", err)
	}

	src, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to open source: %w", err)
	}
	defer src.Close()

	baseName := filepath.Base(sourcePath)
	destPath := filepath.Join(toolsDir, baseName)

	dst, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		return fmt.Errorf("failed to create destination: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(destPath)
		return fmt.Errorf("failed to copy file: %w", err)
	}

	return nil
}

// DeleteTool removes a CLI tool binary from the tools directory.
func (a *App) DeleteTool(name string) error {
	if !validateToolName(name) {
		return fmt.Errorf("invalid tool name")
	}
	toolPath := filepath.Join(a.settings.GetToolsDir(), name)
	return os.Remove(toolPath)
}

func init() {
	application.RegisterEvent[string]("time")
}

func main() {
	exePath, err := os.Executable()
	if err != nil {
		log.Fatal("failed to resolve executable path:", err)
	}
	appDir := filepath.Dir(exePath)

	store, err := NewSettingsStore(appDir)
	if err != nil {
		log.Fatal("failed to initialize settings store:", err)
	}

	app := &App{
		settings: store,
	}

	wailsApp := application.New(application.Options{
		Name:        "CLI Hub",
		Description: "A desktop CLI tool hub",
		Services: []application.Service{
			application.NewService(app),
			application.NewService(&GreetService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	wailsApp.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "CLI Hub",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			wailsApp.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	err = wailsApp.Run()
	if err != nil {
		log.Fatal(err)
	}
}
