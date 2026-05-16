## Context

此项目已推进到中期阶段（6 次 commit），核心架构已就位：Go 后端扫描 tools/、Wails v3 桥接、React 前端动态表单。本次 retroactive change 是补建 opsx 流程控制，管理剩余工作。

## Goals / Non-Goals

**Goals:**
- 将剩余工作（类型清理、冒烟测试、原生文件对话框、generate-cli Skill 完善）纳入流程控制
- 补建 specs 作为后续可验证的契约
- 通过 plan.md 驱动 apply 阶段的 TDD 执行

**Non-Goals:**
- 不重构已有代码（除非功能需要）
- 不引入新工具/依赖
- 不改变已定的 CLI 接口规范

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 类型流 | 绑定层 models.ts 与 types.ts 并行 | 自动生成代码不应手动修改；types.ts 作为前端内部类型可自由调整 |
| 事件 API | Wails v3 Events.On/Off | 替代 legacy window.go 调用，类型安全，支持多窗口 |
| 绑定 API | typed $Call.ByID 模式 | Wails v3 alpha.90+ 标准，替代 runtime untyped 调用 |
| 冒烟测试策略 | 编译检查 + TypeScript 类型检查 + wails3 dev 启动验证 | 无 CI 环境，手动端到端验证 |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Wails v3 alpha 频繁更新 | 锁定 Go module + npm 版本，不盲目追新；遇到问题先查 release notes |
| 自动绑定覆盖手动类型调整 | 只编辑 types.ts，永不动 bindings/；绑定重新生成后比较 diff |
| 工具目录安全（路径遍历） | validateToolName() 正则校验，拒绝 . / 等字符 |
| goroutine 泄漏（CLI 超时/卡死） | WaitGroup 同步，未来加 context 超时 |
