use crate::settings::{AppSettings, SettingsStore};
use tauri::State;

#[tauri::command]
pub fn get_settings(store: State<SettingsStore>) -> AppSettings {
    store.get()
}

#[tauri::command]
pub fn update_settings(store: State<SettingsStore>, settings: AppSettings) {
    store.update(settings);
}

#[tauri::command]
pub fn get_tools_dir(store: State<SettingsStore>) -> String {
    store.get_tools_dir().to_string_lossy().to_string()
}
