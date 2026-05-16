## 1. Cleanup

- [x] 1.1 Remove `as unknown as ToolSchema` cast in MainPanel.tsx, use direct typed binding result
- [x] 1.2 Verify all TypeScript strict checks pass (`npx tsc --noEmit`)

## 2. Smoke Test

- [x] 2.1 Run `wails3 dev` to launch the desktop app
- [x] 2.2 Verify tool list loads and displays the xlsx-merge mock tool
- [x] 2.3 Verify parameter form renders from schema
- [x] 2.4 Execute a test run and verify real-time console output

## 3. Native File Dialogs (next priority)

- [ ] 3.1 Add Wails dialog call for `file-path` format fields
- [ ] 3.2 Add Wails dialog call for `directory-path` format fields

## 4. AI CLI Generator Skill

- [ ] 4.1 Verify `.claude/skills/generate-cli/` Skill file exists and is complete
- [ ] 4.2 Validate Skill output against CLI interface specification
