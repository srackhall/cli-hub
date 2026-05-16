package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// AppSettings holds user-configurable application settings persisted in db/settings.json.
type AppSettings struct {
	CliPath string `json:"cliPath"` // path to directory containing CLI tools
}

// defaultSettingsDir returns the path to the db directory inside the application root.
func defaultSettingsDir(appDir string) string {
	return filepath.Join(appDir, "db")
}

// defaultCliPath returns the path to the cli directory inside the application root.
func defaultCliPath(appDir string) string {
	return filepath.Join(appDir, "cli")
}

func defaultSettings() AppSettings {
	return AppSettings{}
}

// SettingsStore loads, saves, and provides thread-safe access to AppSettings.
type SettingsStore struct {
	mu     sync.RWMutex
	settings AppSettings
	filePath string
	appDir   string
}

// NewSettingsStore loads settings from disk or creates defaults.
// It ensures the db/ and cli/ directories exist.
func NewSettingsStore(appDir string) (*SettingsStore, error) {
	dbDir := defaultSettingsDir(appDir)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return nil, err
	}

	cliDir := defaultCliPath(appDir)
	if err := os.MkdirAll(cliDir, 0755); err != nil {
		return nil, err
	}

	store := &SettingsStore{
		filePath: filepath.Join(dbDir, "settings.json"),
		appDir:   appDir,
	}

	// Load existing or write defaults
	data, err := os.ReadFile(store.filePath)
	if err != nil {
		store.settings = defaultSettings()
		// Set default cliPath if not set
		if store.settings.CliPath == "" {
			store.settings.CliPath = cliDir
		}
		if writeErr := store.save(); writeErr != nil {
			return nil, writeErr
		}
		return store, nil
	}

	if unmarshalErr := json.Unmarshal(data, &store.settings); unmarshalErr != nil {
		store.settings = defaultSettings()
	}
	if store.settings.CliPath == "" {
		store.settings.CliPath = cliDir
	}

	return store, nil
}

// Get returns a copy of the current settings.
func (s *SettingsStore) Get() AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}

// Update replaces the current settings and persists to disk.
func (s *SettingsStore) Update(newSettings AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings = newSettings
	return s.save()
}

// GetToolsDir returns the resolved tools directory, falling back to default.
func (s *SettingsStore) GetToolsDir() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.settings.CliPath != "" {
		return s.settings.CliPath
	}
	return defaultCliPath(s.appDir)
}

func (s *SettingsStore) save() error {
	data, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0644)
}
