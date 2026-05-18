package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	settings *SettingsStore
}

func (a *App) ListTools() []ToolInfo {
	return ScanTools(a.settings.GetToolsDir())
}

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

func (a *App) RefreshTools() {
	ScanTools(a.settings.GetToolsDir())
}

func (a *App) GetSettings() AppSettings {
	return a.settings.Get()
}

func (a *App) UpdateSettings(newSettings AppSettings) {
	a.settings.Update(newSettings)
}

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

func (a *App) DeleteTool(name string) error {
	if !validateToolName(name) {
		return fmt.Errorf("invalid tool name")
	}
	toolPath := filepath.Join(a.settings.GetToolsDir(), name)
	return os.Remove(toolPath)
}

func main() {
	store, err := NewSettingsStore(".")
	if err != nil {
		log.Fatal("failed to initialize settings store:", err)
	}

	app := &App{settings: store}

	// Start HTTP API server for frontend communication
	app.startHTTPServer()

	wailsApp := application.New(application.Options{
		Name:        "CLI Hub",
		Description: "A desktop CLI tool hub",
		Assets: application.AssetOptions{
			Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				http.FileServer(http.FS(assets)).ServeHTTP(w, r)
			}),
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
