package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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
	exePath, err := os.Executable()
	if err != nil {
		log.Fatal("failed to resolve executable path:", err)
	}
	appDir := filepath.Dir(exePath)

	store, err := NewSettingsStore(appDir)
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
				// 构建嵌入文件系统中的路径
				path := r.URL.Path
				if path == "/" {
					path = "/index.html"
				}
				filePath := "frontend/dist" + path
				// 尝试打开文件
				f, err := assets.Open(filePath)
				if err == nil {
					defer f.Close()
					stat, err := f.Stat()
					if err == nil && !stat.IsDir() {
						// 文件存在，读取并返回内容
						data, err := io.ReadAll(f)
						if err == nil {
							// 根据文件扩展名设置Content-Type
							ctype := "text/plain"
							switch {
							case strings.HasSuffix(path, ".html"):
								ctype = "text/html"
							case strings.HasSuffix(path, ".css"):
								ctype = "text/css"
							case strings.HasSuffix(path, ".js"):
								ctype = "application/javascript"
							case strings.HasSuffix(path, ".png"):
								ctype = "image/png"
							case strings.HasSuffix(path, ".jpg") || strings.HasSuffix(path, ".jpeg"):
								ctype = "image/jpeg"
							case strings.HasSuffix(path, ".svg"):
								ctype = "image/svg+xml"
							case strings.HasSuffix(path, ".ttf"):
								ctype = "font/ttf"
							}
							w.Header().Set("Content-Type", ctype)
							w.Write(data)
							return
						}
					}
				}
				// 文件不存在或是目录，返回 index.html (SPA 路由)
				indexData, err := assets.ReadFile("frontend/dist/index.html")
				if err != nil {
					http.Error(w, "index.html not found", http.StatusNotFound)
					return
				}
				w.Header().Set("Content-Type", "text/html")
				w.Write(indexData)
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
