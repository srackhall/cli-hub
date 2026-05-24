use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default)]
    pub cli_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            cli_path: String::new(),
        }
    }
}

pub struct SettingsStore {
    app_dir: PathBuf,
    settings: RwLock<AppSettings>,
}

impl SettingsStore {
    pub fn new(app_dir: &Path) -> Self {
        let db_dir = app_dir.join("db");
        std::fs::create_dir_all(&db_dir).ok();
        let file_path = db_dir.join("settings.json");

        let settings = match std::fs::read_to_string(&file_path) {
            Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
            Err(_) => AppSettings::default(),
        };

        let store = Self {
            app_dir: app_dir.to_path_buf(),
            settings: RwLock::new(settings),
        };
        store.save();
        store
    }

    pub fn get(&self) -> AppSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update(&self, new_settings: AppSettings) {
        *self.settings.write().unwrap() = new_settings;
        self.save();
    }

    pub fn get_tools_dir(&self) -> PathBuf {
        let settings = self.settings.read().unwrap();
        if settings.cli_path.is_empty() {
            self.app_dir.join("cli")
        } else {
            let p = Path::new(&settings.cli_path);
            if p.is_absolute() {
                p.to_path_buf()
            } else {
                self.app_dir.join(p)
            }
        }
    }

    pub fn app_dir(&self) -> &Path {
        &self.app_dir
    }

    fn save(&self) {
        let settings = self.settings.read().unwrap();
        let file_path = self.app_dir.join("db").join("settings.json");
        if let Ok(data) = serde_json::to_string_pretty(&*settings) {
            std::fs::write(&file_path, data).ok();
        }
    }
}
