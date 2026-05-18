package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func (a *App) startHTTPServer() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/tools", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			a.handleListTools(w, r)
		case http.MethodPost:
			a.handleImportTool(w, r)
		default:
			http.Error(w, "method not allowed", 405)
		}
	})

	mux.HandleFunc("/api/tools/refresh", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", 405)
			return
		}
		a.handleRefreshTools(w, r)
	})

	mux.HandleFunc("/api/tools/", func(w http.ResponseWriter, r *http.Request) {
		// Path: /api/tools/{name}/...
		path := strings.TrimPrefix(r.URL.Path, "/api/tools/")
		parts := strings.SplitN(path, "/", 2)
		name := parts[0]
		if name == "" {
			http.Error(w, "tool name required", 400)
			return
		}

		subpath := ""
		if len(parts) > 1 {
			subpath = parts[1]
		}

		switch {
		case subpath == "schema" && r.Method == http.MethodGet:
			a.handleGetSchema(w, r, name)
		case subpath == "execute" && r.Method == http.MethodPost:
			a.handleExecuteTool(w, r, name)
		case subpath == "" && r.Method == http.MethodDelete:
			a.handleDeleteTool(w, r, name)
		default:
			http.Error(w, "not found", 404)
		}
	})

	mux.HandleFunc("/api/dialogs/open-file", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", 405)
			return
		}
		a.handleOpenFileDialog(w, r)
	})

	mux.HandleFunc("/api/dialogs/open-directory", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", 405)
			return
		}
		a.handleOpenDirectoryDialog(w, r)
	})

	mux.HandleFunc("/api/settings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			a.handleGetSettings(w, r)
		case http.MethodPut:
			a.handleUpdateSettings(w, r)
		default:
			http.Error(w, "method not allowed", 405)
		}
	})

	handler := corsMiddleware(mux)

	go func() {
		fmt.Println("[HTTP] API server listening on http://127.0.0.1:9246")
		if err := http.ListenAndServe("127.0.0.1:9246", handler); err != nil {
			fmt.Fprintf(os.Stderr, "[HTTP] server error: %v\n", err)
		}
	}()
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (a *App) handleListTools(w http.ResponseWriter, r *http.Request) {
	tools := ScanTools(a.settings.GetToolsDir())
	if tools == nil {
		tools = []ToolInfo{}
	}
	writeJSON(w, tools)
}

func (a *App) handleGetSchema(w http.ResponseWriter, r *http.Request, name string) {
	if !validateToolName(name) {
		http.Error(w, "invalid tool name", 400)
		return
	}
	schema := a.GetSchema(name)
	if schema == nil {
		http.Error(w, "schema not found", 404)
		return
	}
	writeJSON(w, schema)
}

func (a *App) handleImportTool(w http.ResponseWriter, r *http.Request) {
	mr, err := r.MultipartReader()
	if err != nil {
		http.Error(w, "expected multipart upload", 400)
		return
	}

	toolsDir := a.settings.GetToolsDir()
	if err := os.MkdirAll(toolsDir, 0755); err != nil {
		http.Error(w, "failed to create tools directory", 500)
		return
	}

	var imported string
	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			http.Error(w, "failed to read part", 400)
			return
		}

		filename := filepath.Base(part.FileName())
		if filename == "" || filename == "." || filename == ".." {
			part.Close()
			continue
		}

		destPath := filepath.Join(toolsDir, filename)
		dst, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
		if err != nil {
			part.Close()
			http.Error(w, fmt.Sprintf("failed to create file: %v", err), 500)
			return
		}

		if _, err := io.Copy(dst, part); err != nil {
			dst.Close()
			part.Close()
			os.Remove(destPath)
			http.Error(w, fmt.Sprintf("failed to write file: %v", err), 500)
			return
		}
		dst.Close()
		part.Close()
		imported = filename
		break // single file per request
	}

	if imported == "" {
		http.Error(w, "no file uploaded", 400)
		return
	}

	writeJSON(w, map[string]any{"status": "ok", "name": imported})
}

func (a *App) handleDeleteTool(w http.ResponseWriter, r *http.Request, name string) {
	if err := a.DeleteTool(name); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, map[string]any{"status": "ok"})
}

func (a *App) handleExecuteTool(w http.ResponseWriter, r *http.Request, name string) {
	var params map[string]any
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "invalid JSON body", 400)
		return
	}

	result := a.ExecuteTool(name, params)
	writeJSON(w, result)
}

func (a *App) handleRefreshTools(w http.ResponseWriter, r *http.Request) {
	a.RefreshTools()
	writeJSON(w, map[string]any{"status": "ok"})
}

func (a *App) handleGetSettings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, a.GetSettings())
}

func (a *App) handleUpdateSettings(w http.ResponseWriter, r *http.Request) {
	var s AppSettings
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "invalid JSON body", 400)
		return
	}
	a.UpdateSettings(s)
	writeJSON(w, map[string]any{"status": "ok"})
}

func (a *App) handleOpenFileDialog(w http.ResponseWriter, r *http.Request) {
	if a.wailsApp == nil {
		http.Error(w, "native dialogs unavailable", 500)
		return
	}
	dialog := a.wailsApp.Dialog.OpenFile().
		CanChooseFiles(true).
		CanChooseDirectories(false).
		SetTitle("Select File")

	result, err := dialog.PromptForSingleSelection()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, map[string]any{"path": result})
}

func (a *App) handleOpenDirectoryDialog(w http.ResponseWriter, r *http.Request) {
	if a.wailsApp == nil {
		http.Error(w, "native dialogs unavailable", 500)
		return
	}
	dialog := a.wailsApp.Dialog.OpenFile().
		CanChooseFiles(false).
		CanChooseDirectories(true).
		SetTitle("Select Directory")

	result, err := dialog.PromptForSingleSelection()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, map[string]any{"path": result})
}
