mod commands;
mod executor;
mod settings;

use settings::SettingsStore;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            std::fs::create_dir_all(&app_dir).ok();

            let store = SettingsStore::new(&app_dir);
            let tools_dir = store.get_tools_dir();
            std::fs::create_dir_all(&tools_dir).ok();

            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tools::list_tools,
            commands::tools::get_tool_schema,
            commands::tools::import_tool,
            commands::tools::delete_tool,
            commands::tools::refresh_tools,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_tools_dir,
            executor::execute_tool,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
