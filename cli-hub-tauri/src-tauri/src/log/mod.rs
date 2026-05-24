use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct LogEntry {
    pub level: String,
    pub msg: String,
}

#[tauri::command]
pub fn log_frontend(entries: Vec<LogEntry>) {
    for entry in entries {
        match entry.level.as_str() {
            "debug" => tracing::debug!("[frontend] {}", entry.msg),
            "info" => tracing::info!("[frontend] {}", entry.msg),
            "warn" => tracing::warn!("[frontend] {}", entry.msg),
            "error" => tracing::error!("[frontend] {}", entry.msg),
            _ => tracing::info!("[frontend] {}", entry.msg),
        }
    }
}
