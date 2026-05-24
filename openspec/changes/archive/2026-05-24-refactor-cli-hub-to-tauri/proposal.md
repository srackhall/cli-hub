## Why

CLI Hub 当前基于 Wails v3/Go 构建，跨平台（尤其是 Windows）性能和稳定性不满足需求。Tauri v2 在跨平台一致性、包体积、启动速度方面有明显优势。本次重构将整个客户端从 Wails v3/Go 迁移到 Tauri v2/Rust，同时简化架构（移除英文 i18n、仅中文硬编码）。

## What Changes

- 新建 `cli-hub-tauri/` 项目，基于 Tauri v2 + React 19 + Vite 6 + Tailwind 4
- Rust 后端替代 Go 后端：工具执行（异步流式）、设置管理（JSON 文件持久化）、进程管理（超时控制）
- React 前端替代 Wails 前端：保持功能一致（侧边栏工具列表、主面板执行区、控制台流式输出、设置面板）
- Tauri IPC（`#[tauri::command]` + `invoke()` + `emit()/listen()`）替代 Wails HTTP API
- 移除所有英文 i18n，中文字符串硬编码
- 保留原有 Go 版本项目不动
- CI/CD 通过 GitHub Actions 双平台构建（macOS arm64 + Windows amd64）

## Capabilities

### New Capabilities

- `tool-execution`: 工具脚本的 CRUD 管理、异步流式执行（stdout/stderr 实时推送）、300 秒超时保护
- `settings-management`: 应用设置的读写持久化（主题、工具目录等），JSON 文件存储 + RwLock 线程安全
- `desktop-shell`: Tauri 桌面窗口管理（macOS 毛玻璃标题栏、Windows 隐藏控制台窗口、拖拽文件路径解析、原生对话框）
- `ci-build-pipeline`: GitHub Actions 双平台构建流水线（macOS arm64 .app + Windows amd64 .msi）

### Modified Capabilities

<!-- 全新项目，无现有 capability 被修改 -->

## Impact

- **新增目录**: `cli-hub-tauri/`（完整 Tauri 项目，约 50 个文件）
- **新增 CI**: `.github/workflows/build-tauri.yml`
- **Go 项目**: 不受影响，保留在 `cli-hub/` 目录
- **依赖**: Rust 工具链、Node.js 22、Tauri v2 CLI、tauri-apps/tauri-action@v0
- **产物**: macOS `.app` bundle、Windows `.msi` installer
