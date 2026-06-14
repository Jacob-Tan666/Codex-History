---
name: codex-history
description: 在 Codex 对话中管理本机历史会话，支持本地可视化 UI、以表格列出 session 与标题、preview、export、archive、recover、按 session-id 删除或全量删除，并同步清理 history.jsonl。
---

# Codex History Skill

## 适用场景
- 在 Codex CLI 对话中查看本机会话历史
- 以表格形式展示会话来源、时间、标题、`sessionId` 和文件路径，方便用户决定删除或保留
- 预览指定会话消息内容
- 导出指定会话为 Markdown 内容文件（包含 `sessionId`、来源、时间与按时间顺序排列的用户/助手消息）
- 归档指定会话到 `archived_sessions`
- 将误归档会话恢复到 `sessions/YYYY/MM/DD`
- 按明确 `session-id` 删除会话，并同步清理 `history.jsonl`
- 在用户明确要求时全量删除 `sessions`、`archived_sessions` 和 `history.jsonl` 中的对话信息
- 启动本地 Web 可视化界面，用于搜索、筛选、预览、导出、归档、恢复或删除会话

## 触发条件（必须同时满足）
- 用户请求属于 `ui`、`list`、`preview`、`export`、`archive`、`recover`、`delete` 七类之一
- 目标是 Codex 本地历史（`CODEX_HOME` 或 `~/.codex`）
- 可通过 `node scripts/history-cli.js` 完成，不需要其他脚本

## 禁止触发（命中任一即拒绝）
- 模糊删除请求（如“删最近几条”但未提供 `session-id`，或未明确要求全部删除）
- 用户未确认不可恢复风险时执行 `delete --all --force`
- 任何超出当前项目工作目录与 `CODEX_HOME` 会话数据范围的文件系统操作
- 任何非白名单命令（如 `rm`、`del`、`git`、`python`、自定义脚本）
- 修改、覆盖或重命名 Skill 源码与配置文件

## 能力边界
- Skill 为自包含实现，安装到 `$CODEX_HOME/skills/codex-history` 后可独立运行
- 默认读取 `CODEX_HOME`，未设置时回退到 `~/.codex`
- 只处理会话相关数据：`sessions`、`archived_sessions`、`history.jsonl`
- `ui` 仅启动本机回环地址上的本地控制台，默认地址为 `http://127.0.0.1:17876/`
- `ui` 中的写操作仍受本 Skill 的相同能力边界限制；删除操作仍为物理删除且不可恢复
- `export` 仅允许写入当前项目工作目录内的相对路径，不允许写到工作目录外
- `export` 使用单一导出格式：文件头包含 `sessionId`、来源、时间；正文按时间顺序导出真实 `user/assistant` 消息，且不把 `system` 正文重复导出到正文部分
- `archive` 仅允许把 `sessions` 中会话归档到 `archived_sessions`
- `recover` 仅允许把 `archived_sessions` 中会话恢复到 `sessions/YYYY/MM/DD`
- `delete` 为物理删除：会删除会话文件并清理 `history.jsonl` 对应行，执行后不可恢复（除非用户有外部备份）
- `delete --all --force` 为全量物理删除：会删除 `sessions` 与 `archived_sessions` 下所有 `.jsonl` 会话文件，并清空 `history.jsonl`
- 不负责系统维护、权限变更、环境清理、备份恢复等操作

## 操作白名单（严格）

### ui
```bash
node scripts/history-cli.js ui [--host 127.0.0.1] [--port 17876] [--open]
```

### list
```bash
node scripts/history-cli.js list [--source all|sessions|archived] [--limit N] [--format table|detail] [--json]
```

### preview
```bash
node scripts/history-cli.js preview --session-id <id> [--max-messages N] [--json]
```

### export
```bash
node scripts/history-cli.js export --session-id <id> --output <file> [--format md] [--max-messages N] [--json]
```

### archive
```bash
node scripts/history-cli.js archive --session-id <id> [--session-id <id> ...] [--force] [--json]
```

### recover
```bash
node scripts/history-cli.js recover --session-id <id> [--session-id <id> ...] [--force] [--json]
```

### delete
```bash
node scripts/history-cli.js delete --session-id <id> [--session-id <id> ...] [--force] [--json]
node scripts/history-cli.js delete --all --force [--json]
```

除上述命令外，一律拒绝执行。

## 删除护栏（强制）
1. 删除指定会话时必须先校验 `session-id` 明确且非空
2. 删除指定会话前必须先执行 `preview`，确认目标会话存在且匹配
3. 全量删除前必须先执行 `list --source all --format table`，把表格展示给用户用于确认删除/保留范围
4. 执行删除时必须包含 `--force`
5. 删除前必须明确提醒用户：`delete` / `delete --all` 为物理删除且不可恢复
6. `--all` 不能与 `--session-id` 混用
7. 删除后必须返回删除摘要：`all`、`sessionCount`、`sessionFileCount`、`deletedFiles`、`failedFiles`、`removedHistoryLines`

## 执行流程（建议）
1. 识别用户意图并匹配 `ui/list/preview/export/archive/recover/delete`
2. 检查是否命中禁止触发项
3. 仅使用白名单命令执行操作
4. 按统一输出格式返回结果

## 统一输出格式
- `command`：实际执行命令
- `sessionIds`：目标会话 ID 列表（`list` 可为空）
- `result`：成功/失败与核心结果摘要
- `exitCode`：CLI 退出码
- 失败时额外输出：`reason`、`nextAction`

### list 输出约定（强制）
- 人类可读默认输出必须为表格，必须包含 `来源`、`标题`、`sessionId`、`时间`、`文件`
- 用户需要逐条查看文件路径时，可使用 `--format detail` 输出详细列表
- 标题为空时回退 `sessionId` 作为标题，禁止省略标题字段
- 标题过长时可摘要显示，但必须保留标题字段标签

## 越界拒绝模板
```text
该请求超出 codex-history 的能力边界。
本 Skill 仅支持 list / preview / export / archive / recover / delete（按 session-id 精确操作），
本地可视化 ui，以及用户明确要求并确认风险后的 delete --all。
不会执行白名单之外命令，也不会操作当前项目工作目录与 `CODEX_HOME` 之外路径。
```

## 退出码
- `0`：成功
- `2`：参数错误
- `3`：目标会话不存在
- `4`：部分失败（存在文件操作失败或冲突跳过，如 `archive/recover/delete`）
- `5`：未处理异常

## 示例
```bash
node scripts/history-cli.js list --limit 5
node scripts/history-cli.js ui --open
node scripts/history-cli.js list --source all --format table
node scripts/history-cli.js preview --session-id sess-123 --json
node scripts/history-cli.js export --session-id sess-123 --output ./exports/sess-123.md --format md
node scripts/history-cli.js archive --session-id sess-123
node scripts/history-cli.js recover --session-id sess-123
node scripts/history-cli.js delete --session-id sess-123 --session-id sess-456 --force
node scripts/history-cli.js delete --all --force
```
