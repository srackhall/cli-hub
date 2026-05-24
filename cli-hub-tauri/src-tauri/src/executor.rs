use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::{timeout, Duration};

use crate::settings::SettingsStore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteResult {
    pub status: String,
    pub output: String,
    pub code: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolOutput {
    pub stream: String,
    pub text: String,
}

fn build_args(params: &HashMap<String, serde_json::Value>) -> Vec<String> {
    let mut args = Vec::new();
    for (k, v) in params {
        let is_valid = k
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '.');
        if !is_valid {
            continue;
        }
        match v {
            serde_json::Value::Bool(true) => {
                args.push(format!("--{}", k));
            }
            serde_json::Value::String(s) if !s.is_empty() => {
                args.push(format!("--{}", k));
                args.push(s.clone());
            }
            serde_json::Value::Array(arr) => {
                for item in arr {
                    if let Some(s) = item.as_str() {
                        args.push(format!("--{}", k));
                        args.push(s.to_string());
                    }
                }
            }
            serde_json::Value::Number(n) => {
                args.push(format!("--{}", k));
                args.push(n.to_string());
            }
            _ => {}
        }
    }
    args
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
pub async fn execute_tool(
    app_handle: AppHandle,
    store: State<'_, SettingsStore>,
    name: String,
    params: HashMap<String, serde_json::Value>,
) -> Result<ExecuteResult, String> {
    if !validate_tool_name(&name) {
        return Ok(ExecuteResult {
            status: "error".into(),
            output: "invalid tool name".into(),
            code: -1,
        });
    }
    let tool_path = store.get_tools_dir().join(&name);
    if !tool_path.exists() {
        return Ok(ExecuteResult {
            status: "error".into(),
            output: format!("tool not found: {}", name),
            code: -1,
        });
    }

    let args = build_args(&params);

    let mut cmd = Command::new(&tool_path);
    cmd.args(&args);
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());
    cmd.stdin(std::process::Stdio::null());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            return Ok(ExecuteResult {
                status: "error".into(),
                output: e.to_string(),
                code: -1,
            });
        }
    };

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let handle = app_handle.clone();

    let stdout_handle = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = handle.emit(
                "tool-output",
                ToolOutput {
                    stream: "stdout".into(),
                    text: line,
                },
            );
        }
    });

    let handle2 = app_handle.clone();
    let stderr_handle = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = handle2.emit(
                "tool-output",
                ToolOutput {
                    stream: "stderr".into(),
                    text: line,
                },
            );
        }
    });

    let result = match timeout(Duration::from_secs(300), child.wait()).await {
        Ok(Ok(status)) => {
            let code = status.code().unwrap_or(-1);
            if code == 0 {
                ExecuteResult {
                    status: "ok".into(),
                    output: "执行完成".into(),
                    code: 0,
                }
            } else if code == 1 {
                ExecuteResult {
                    status: "error".into(),
                    output: "参数错误".into(),
                    code,
                }
            } else {
                ExecuteResult {
                    status: "error".into(),
                    output: "运行时错误".into(),
                    code,
                }
            }
        }
        Ok(Err(e)) => ExecuteResult {
            status: "error".into(),
            output: e.to_string(),
            code: -1,
        },
        Err(_) => {
            let _ = child.kill().await;
            ExecuteResult {
                status: "error".into(),
                output: "执行超时 (超过 5 分钟)".into(),
                code: -1,
            }
        }
    };

    stdout_handle.abort();
    stderr_handle.abort();

    Ok(result)
}
