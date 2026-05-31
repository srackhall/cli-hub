use crate::settings::SettingsStore;
use tauri::State;

#[tauri::command]
pub fn get_tools_dir(store: State<SettingsStore>) -> String {
    store.get_tools_dir().to_string_lossy().to_string()
}

#[tauri::command]
pub fn get_data_dir(store: State<SettingsStore>) -> String {
    store.get_data_dir().to_string_lossy().to_string()
}

#[tauri::command]
pub fn open_tools_dir(store: State<SettingsStore>) {
    store.open_tools_dir();
}

#[tauri::command]
pub fn open_data_dir(store: State<SettingsStore>) {
    store.open_data_dir();
}
