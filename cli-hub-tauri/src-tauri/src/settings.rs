use std::path::{Path, PathBuf};

/// Platform-agnostic "open in file manager" helper.
#[cfg(target_os = "macos")]
fn open_in_file_manager(path: &std::path::Path) {
    std::process::Command::new("open")
        .arg(path)
        .spawn()
        .ok();
}

#[cfg(target_os = "windows")]
fn open_in_file_manager(path: &std::path::Path) {
    std::process::Command::new("explorer")
        .arg(path)
        .spawn()
        .ok();
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn open_in_file_manager(path: &std::path::Path) {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .ok();
}

pub struct SettingsStore {
    app_dir: PathBuf,
}

impl SettingsStore {
    pub fn new(app_dir: &Path) -> Self {
        // Ensure db/ exists for settings.json (future use: language pref, etc.)
        let db_dir = app_dir.join("db");
        std::fs::create_dir_all(&db_dir).ok();
        // Create settings.json with empty object if it doesn't exist
        let file_path = db_dir.join("settings.json");
        if !file_path.exists() {
            std::fs::write(&file_path, "{}").ok();
        }

        Self {
            app_dir: app_dir.to_path_buf(),
        }
    }

    pub fn get_tools_dir(&self) -> PathBuf {
        self.app_dir.join("cli")
    }

    pub fn get_data_dir(&self) -> PathBuf {
        self.app_dir.join("db")
    }

    pub fn open_tools_dir(&self) {
        let dir = self.get_tools_dir();
        std::fs::create_dir_all(&dir).ok();
        open_in_file_manager(&dir);
    }

    pub fn open_data_dir(&self) {
        let dir = self.get_data_dir();
        std::fs::create_dir_all(&dir).ok();
        open_in_file_manager(&dir);
    }
}
