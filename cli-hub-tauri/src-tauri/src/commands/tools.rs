use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

use crate::settings::SettingsStore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInfo {
    pub name: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub description_zh: String,
    #[serde(default)]
    pub long_description: String,
    #[serde(default)]
    pub long_description_zh: String,
    pub ready: bool,
    #[serde(default)]
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaProp {
    #[serde(rename = "type")]
    pub prop_type: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub description_zh: String,
    #[serde(default)]
    pub default: serde_json::Value,
    #[serde(default)]
    pub r#enum: Vec<String>,
    #[serde(default)]
    pub format: String,
    #[serde(default)]
    pub minimum: Option<f64>,
    #[serde(default)]
    pub maximum: Option<f64>,
    #[serde(default)]
    pub items: Option<ArrayItems>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArrayItems {
    #[serde(rename = "type")]
    pub item_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepGroup {
    pub title: String,
    #[serde(default)]
    pub title_zh: String,
    pub fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolSchema {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub title_zh: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub description_zh: String,
    #[serde(default)]
    pub long_description: String,
    #[serde(default)]
    pub long_description_zh: String,
    #[serde(rename = "type")]
    pub schema_type: String,
    pub properties: HashMap<String, SchemaProp>,
    #[serde(default)]
    pub required: Vec<String>,
    #[serde(default, rename = "x-steps")]
    pub x_steps: Vec<StepGroup>,
}

fn is_executable(path: &PathBuf) -> bool {
    #[cfg(target_os = "windows")]
    {
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase() == "exe")
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::metadata(path)
            .map(|m| m.permissions().mode() & 0o111 != 0)
            .unwrap_or(false)
    }
}

fn validate_tool_name(name: &str) -> bool {
    if name.is_empty()
        || name.contains('/')
        || name.contains('\\')
        || name == "."
        || name == ".."
    {
        return false;
    }
    std::path::Path::new(name)
        .file_name()
        .map(|n| n.to_string_lossy() == name)
        .unwrap_or(false)
}

#[tauri::command]
pub fn list_tools(store: State<SettingsStore>) -> Vec<ToolInfo> {
    let tools_dir = store.get_tools_dir();
    let mut tools = Vec::new();
    let entries = match std::fs::read_dir(&tools_dir) {
        Ok(e) => e,
        Err(_) => return tools,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if !is_executable(&path) {
            continue;
        }

        let mut tool = ToolInfo {
            name: name.clone(),
            version: String::new(),
            description: String::new(),
            description_zh: String::new(),
            long_description: String::new(),
            long_description_zh: String::new(),
            ready: false,
            error: String::new(),
        };

        if let Ok(output) = std::process::Command::new(&path)
            .arg("--version")
            .output()
        {
            if output.status.success() {
                tool.version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            }
        }

        match std::process::Command::new(&path)
            .arg("--schema")
            .output()
        {
            Ok(output) if output.status.success() => {
                let json_str = String::from_utf8_lossy(&output.stdout);
                match serde_json::from_str::<ToolSchema>(&json_str) {
                    Ok(schema) => {
                        tool.description = schema.description.clone();
                        tool.description_zh = schema.description_zh.clone();
                        tool.long_description = schema.long_description.clone();
                        tool.long_description_zh = schema.long_description_zh.clone();
                        tool.ready = true;
                    }
                    Err(e) => {
                        tool.error = format!("invalid schema JSON: {}", e);
                    }
                }
            }
            Ok(output) => {
                tool.error = format!(
                    "schema call failed: {}",
                    String::from_utf8_lossy(&output.stderr).trim()
                );
            }
            Err(e) => {
                tool.error = format!("schema call failed: {}", e);
            }
        }

        tools.push(tool);
    }

    tools
}

#[tauri::command]
pub fn get_tool_schema(store: State<SettingsStore>, name: String) -> Option<ToolSchema> {
    if !validate_tool_name(&name) {
        return None;
    }
    let tools_dir = store.get_tools_dir();
    let tool_path = tools_dir.join(&name);
    if !tool_path.exists() {
        return None;
    }
    let output = std::process::Command::new(&tool_path)
        .arg("--schema")
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let json_str = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str::<ToolSchema>(&json_str).ok()
}

#[tauri::command]
pub fn import_tool(store: State<SettingsStore>, source_path: String) -> Result<String, String> {
    let src = std::path::Path::new(&source_path);
    let base_name = src
        .file_name()
        .ok_or("invalid source path")?
        .to_string_lossy()
        .to_string();

    let tools_dir = store.get_tools_dir();
    std::fs::create_dir_all(&tools_dir).map_err(|e| e.to_string())?;

    let dest = tools_dir.join(&base_name);
    std::fs::copy(src, &dest).map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = std::fs::metadata(&dest) {
            let mut perms = meta.permissions();
            perms.set_mode(0o755);
            std::fs::set_permissions(&dest, perms).ok();
        }
    }

    Ok(base_name)
}

#[tauri::command]
pub fn delete_tool(store: State<SettingsStore>, name: String) -> Result<(), String> {
    if !validate_tool_name(&name) {
        return Err("invalid tool name".into());
    }
    let path = store.get_tools_dir().join(&name);
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn refresh_tools() {
    // Frontend re-calls list_tools after this
}
