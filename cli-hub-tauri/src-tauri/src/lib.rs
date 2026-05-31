mod commands;
mod executor;
mod log;
mod settings;

use settings::SettingsStore;
use tauri::Manager;

fn init_logging(app_dir: &std::path::Path) {
    let log_file = std::fs::File::create(app_dir.join("app.log")).expect("failed to create log file");
    let subscriber = tracing_subscriber::fmt()
        .with_writer(std::sync::Mutex::new(log_file))
        .with_ansi(false)
        .with_target(false)
        .with_level(true)
        .compact()
        .try_init();
    if subscriber.is_ok() {
        tracing::info!("日志系统已启动");
    }
}

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

            init_logging(&app_dir);

            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tools::list_tools,
            commands::tools::get_tool_schema,
            commands::tools::import_tool,
            commands::tools::delete_tool,
            commands::tools::refresh_tools,
            commands::settings::get_tools_dir,
            commands::settings::get_data_dir,
            commands::settings::open_tools_dir,
            commands::settings::open_data_dir,
            executor::execute_tool,
            log::log_frontend,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
