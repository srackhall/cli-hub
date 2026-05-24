## 1. 项目初始化

- [x] 1.1 创建 Tauri v2 项目脚手架（Cargo.toml、tauri.conf.json、package.json）
- [x] 1.2 配置前端技术栈（React 19 + Vite 6 + Tailwind 4 + shadcn/ui）
- [x] 1.3 配置 Rust 依赖（tauri 2、tokio、serde、tracing、tracing-subscriber）
- [x] 1.4 配置 Tauri 插件（dialog、shell）
- [x] 1.5 生成平台图标（npx tauri icon）
- [x] 1.6 配置 .gitignore

## 2. Rust 后端 — 设置管理

- [x] 2.1 实现 SettingsStore（RwLock<AppSettings> + JSON 文件持久化）
- [x] 2.2 实现 get_settings 命令
- [x] 2.3 实现 save_settings 命令
- [x] 2.4 实现 get_tools_dir 命令
- [x] 2.5 实现文件日志系统（tracing-subscriber 写入日志文件）

## 3. Rust 后端 — 工具管理

- [x] 3.1 实现 validate_tool_name 安全校验
- [x] 3.2 实现 list_tools 命令
- [x] 3.3 实现 get_tool 命令
- [x] 3.4 实现 create_tool 命令
- [x] 3.5 实现 update_tool 命令
- [x] 3.6 实现 delete_tool 命令

## 4. Rust 后端 — 工具执行

- [x] 4.1 实现 build_args 参数构建（支持 bool/string/array/number）
- [x] 4.2 实现参数 key 安全过滤（白名单 [a-zA-Z0-9.-]）
- [x] 4.3 实现 execute_tool 命令（异步子进程启动）
- [x] 4.4 实现 stdout/stderr 并发流式读取（BufReader::lines）
- [x] 4.5 实现 tool-output 事件实时推送到前端
- [x] 4.6 实现 300 秒超时保护
- [x] 4.7 实现退出码分类处理（0=成功、1=参数错误、其他=运行时错误）
- [x] 4.8 实现 Windows CREATE_NO_WINDOW 控制台隐藏

## 5. Rust 后端 — 应用入口

- [x] 5.1 实现 lib.rs（注册所有命令、配置 tracing、设置持久化目录）
- [x] 5.2 实现 main.rs

## 6. React 前端 — IPC 层

- [x] 6.1 实现 api.ts（9 个 invoke 调用封装 + 类型定义）
- [x] 6.2 实现 tool-output 事件监听（App.tsx 中 listen）

## 7. React 前端 — UI 组件

- [x] 7.1 实现 Sidebar 组件（工具列表、新建/删除、搜索过滤）
- [x] 7.2 实现 MainPanel 组件（工具执行区、参数表单）
- [x] 7.3 实现 DynamicForm 组件（多步骤表单 x-steps、布尔/字符串/路径参数）
- [x] 7.4 实现 FilePathInput 组件（文件路径输入 + 拖拽接收）
- [x] 7.5 实现 Console 组件（stdout/stderr 流式展示、自动滚动）
- [x] 7.6 实现 Settings 组件（主题切换、工具目录配置、原生文件夹选择器）
- [x] 7.7 实现 StatusBar 组件（执行状态指示）
- [x] 7.8 实现 HelpTooltip 组件
- [x] 7.9 实现 shadcn/ui 基础组件（button、input、checkbox、scroll-area、select）

## 8. React 前端 — 主题与样式

- [x] 8.1 实现暗色/亮色主题切换（CSS 变量 + Tailwind class）
- [x] 8.2 实现主题持久化（localStorage + 启动恢复）

## 9. macOS 桌面集成

- [x] 9.1 配置 Overlay 标题栏 + hiddenTitle（毛玻璃效果）
- [x] 9.2 配置拖拽事件（tauri://drag-drop）
- [x] 9.3 配置窗口约束（默认 960x680、最小 700x480、居中）

## 10. Windows 桌面集成

- [x] 10.1 验证 CREATE_NO_WINDOW 子进程隐藏
- [x] 10.2 验证 MSI 构建产物

## 11. CI/CD

- [x] 11.1 编写 GitHub Actions workflow（build-tauri.yml）
- [x] 11.2 配置 macOS arm64 构建（aarch64-apple-darwin --bundles app）
- [x] 11.3 配置 Windows amd64 构建（x86_64-pc-windows-msvc --bundles msi）
- [x] 11.4 配置构建产物上传（upload-artifact@v4）
- [x] 11.5 验证 CI 双平台构建通过

## 12. 最终验证

- [x] 12.1 superpowers-bridge 专家 agent 引导子 agent 全面审计
- [x] 12.2 功能对齐验证（vs 原 Go/Wails 版本）
- [x] 12.3 代码质量审查（Rust 安全、React 组件结构）
- [x] 12.4 编写审计报告
