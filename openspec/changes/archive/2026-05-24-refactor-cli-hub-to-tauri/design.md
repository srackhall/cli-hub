## Context

CLI Hub 是一个桌面端 CLI 工具管理面板，当前基于 Wails v3/Go 实现。用户反馈 Windows 平台性能和稳定性不达预期。Tauri v2 在跨平台渲染一致性（系统 WebView）、包体积、内存占用方面表现更好。

项目已完整实现并验证通过 CI 构建（macOS arm64 + Windows amd64），本次 artifacts 记录该实现的设计决策。

**约束**: 不本地构建产物、仅中文（无 i18n）、保留原 Go 项目、功能对齐优先。

## Goals / Non-Goals

**Goals:**
- 完整的 Tauri v2 桌面应用，覆盖工具执行、设置管理、窗口控制全部功能
- 双平台 CI 构建流水线（macOS arm64 .app + Windows amd64 .msi）
- 异步流式输出（stdout/stderr 实时推送到前端）
- 线程安全的 JSON 文件持久化

**Non-Goals:**
- Linux 构建（暂无需求）
- 自动更新系统
- 插件市场 / 远程工具分发
- 多语言支持
- DMG/exe 打包（仅 app/msi）

## Decisions

### 1. IPC 协议：Tauri Commands + Events

**选择**: 请求-响应用 `#[tauri::command]` + `invoke()`，流式推用 `emit()` + `listen()`。

**替代方案**:
- 嵌入式 HTTP 服务器（如 axum）：增加端口管理复杂度，与 Tauri 模型不匹配
- 纯 Events 双向：请求-响应语义弱，不适合设置 CRUD

**理由**: Tauri Commands 天然支持 `async`、自动序列化、类型安全。Events 适合无界流式数据（工具输出行）。二者各司其职。

### 2. 设置持久化：RwLock<AppSettings> + JSON 文件

**选择**: `std::sync::RwLock` 保护 `AppSettings` 结构体，读写时序列化到 `db/settings.json`。

**替代方案**:
- SQLite：过度设计，设置项少且结构扁平
- Tauri Store plugin：引入额外依赖，灵活性受限

**理由**: 设置项极少（工具目录路径、主题等 < 10 个字段），JSON 文件 + RwLock 足够且零依赖。

### 3. 前端框架：React 19 + Vite 6 + Tailwind 4 + shadcn/ui

**选择**: 沿用 Wails 版本的技术栈（React + Vite + Tailwind），UI 组件库从自建切换到 shadcn/ui（Radix primitives）。

**理由**: 保持开发体验一致，shadcn/ui 提供更好的可访问性和主题支持。Tailwind 4 的 CSS-first 配置简化了暗色模式切换（CSS 变量 + class 切换）。

### 4. CI 构建策略：tauri-apps/tauri-action@v0

**选择**: 使用官方 `tauri-apps/tauri-action@v0` GitHub Action，macOS 构建 `.app` bundle，Windows 构建 `.msi`。

**理由**: 官方 Action 自动处理 Tauri CLI 版本匹配、代码签名环境检测。`.app` 而非 `.dmg` 避免 CI 环境打包脚本兼容问题。

### 5. 安全：命令注入防护

**选择**: 双层验证 — `validate_tool_name()` 拒绝路径遍历字符，`build_args()` 对参数 key 做字符白名单过滤（仅允许 `[a-zA-Z0-9.-]`）。

**理由**: 用户提供的工具脚本名称和参数直接传递给 `tokio::process::Command`，必须严格过滤防止参数注入。

## Risks / Trade-offs

- **[低] 设置文件非原子写入**: JSON 序列化直接覆盖文件，极端崩溃可能损坏 → 影响极小，设置写入频率极低（用户手动保存）
- **[低] Windows 路径分隔符**: 工具目录路径在 Windows 使用 `\`，需确保前端统一处理 → 前端统一使用 `FilePathInput` 组件封装
- **[低] WebView 兼容性**: 不同 Windows 版本可能使用不同 Edge WebView2 版本 → Tauri v2 在安装时引导用户安装 WebView2 运行时

## Open Questions

<!-- 无待解决问题 — 项目已完整实现并验证通过 -->
