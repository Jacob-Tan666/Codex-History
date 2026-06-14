# Codex History Skill

中文 | [English](./README.en.md)

## 1. 简单介绍 Skill

`Codex History Skill` 用于管理本机 Codex 对话历史，支持表格查看、预览、导出、归档、恢复、删除指定会话和全量删除对话信息。

## 2. 功能清单

- 列出会话历史（默认仅展示未归档 `sessions`，支持通过 `--source archived|all` 查看归档或全部）
- 会话列表默认以表格展示来源、时间、标题、`sessionId` 和文件路径，方便决定删除或保留具体对话
- 按 `session-id` 预览会话内容
- 将指定会话导出为 Markdown 内容文件（输出路径必须位于当前项目工作目录内，导出内容包含 `sessionId`、来源、时间与按时间顺序排列的用户/助手消息）
- 归档指定会话（`sessions` -> `archived_sessions`）
- 恢复误归档会话（`archived_sessions` -> `sessions/YYYY/MM/DD`）
- 删除指定会话并同步清理 `history.jsonl`
- 使用 `delete --all --force` 全量删除 `sessions`、`archived_sessions` 和 `history.jsonl` 中的对话信息
- 提供本地 Web 可视化界面，可搜索、筛选、预览、导出、归档、恢复和删除会话
- 支持普通文本输出和 `--json` 输出
- 当命令带 `--json` 时，成功和失败都会输出结构化 JSON，便于脚本调用

## 2.1 重要提醒（删除不可恢复）

- `delete` 是**物理删除**，会直接删除会话文件，并从 `history.jsonl` 移除对应记录。
- `delete --all --force` 是**全量物理删除**，会删除 `sessions` 与 `archived_sessions` 下所有 `.jsonl` 会话文件，并清空 `history.jsonl`。
- `delete` **必须显式传入** `--force`，否则会直接返回参数错误。
- `--all` 不能与 `--session-id` 混用。
- 删除后默认**不可恢复**，请仅在确认无误时执行。
- 若需要“可撤销”的处理，请优先使用 `archive`，误操作可用 `recover` 恢复。
- `archive` / `recover` 遇到目标同名文件时，默认跳过并记为冲突；传入 `--force` 时会优先覆盖目标文件。

## 3. 如何使用

1) 从 GitHub Releases 下载 `codex-history-skill.zip`。  
2) 解压到 `~/.codex/skills`（压缩包内已包含 `codex-history/` 目录）。  
3) 重启 Codex。  
4) 在 Codex 对话中直接让 AI 使用该 Skill。

Windows（PowerShell）示例：

```powershell
$skillDir = "$env:USERPROFILE\.codex\skills"
New-Item -ItemType Directory -Force $skillDir | Out-Null
Expand-Archive -Path .\codex-history-skill.zip -DestinationPath $skillDir -Force
```

macOS / Linux 示例：

```bash
mkdir -p ~/.codex/skills
unzip codex-history-skill.zip -d ~/.codex/skills
```

## 3.1 CLI 命令速查

```bash
# 启动本地可视化界面
node scripts/history-cli.js ui --open

# 列表（默认最近 10 条未归档会话）
node scripts/history-cli.js list --limit 10

# 查看全部会话（含归档）
node scripts/history-cli.js list --source all --limit 10

# 以表格形式查看全部会话，便于决定删除/保留
node scripts/history-cli.js list --source all --format table

# 使用详细列表格式查看
node scripts/history-cli.js list --format detail --limit 10

# 仅看归档会话
node scripts/history-cli.js list --source archived --limit 10

# 预览会话
node scripts/history-cli.js preview --session-id <id>

# 预览会话并返回 JSON
node scripts/history-cli.js preview --session-id <id> --json

# 导出会话为 Markdown 内容文件（包含 `sessionId`、来源、时间与交替式消息记录）
node scripts/history-cli.js export --session-id <id> --output ./exports/session.md

# 归档会话
node scripts/history-cli.js archive --session-id <id>

# 归档会话（目标冲突时允许覆盖）
node scripts/history-cli.js archive --session-id <id> --force

# 恢复归档会话
node scripts/history-cli.js recover --session-id <id>

# 恢复归档会话（目标冲突时允许覆盖）
node scripts/history-cli.js recover --session-id <id> --force

# 删除会话（物理删除，不可恢复）
node scripts/history-cli.js delete --session-id <id> --force

# 删除全部对话信息（物理删除，不可恢复）
node scripts/history-cli.js delete --all --force
```

## 3.2 可视化界面

启动后访问 `http://127.0.0.1:17876/`：

- 左侧可按来源筛选 `sessions` / `archived` / `all`，并按标题、`sessionId`、文件路径搜索。
- 右侧可预览会话消息，直接导出 Markdown，或执行归档、恢复、删除操作。
- 删除仍是物理删除且不可恢复，界面会在执行前弹出确认。

## 3.3 export 导出说明

- `export` 使用单一导出格式：文件头固定包含 `sessionId`、来源、时间。
- 正文按会话原始顺序输出真实 `user/assistant` 消息，并为每条消息展示时间与正文代码块。
- 默认不导出 `system` 消息到正文，也不导出仅由角色提示、环境注入或包装模板组成的无用内容。
- `--max-messages` 仅统计最终实际写入正文的有效消息。

## 3.4 兼容性

- Node.js `>=14.0.0`
- 建议在 Node.js 18 或更高版本运行

## 4. 示例

```text
使用 codex-history skill 列举最近对话

使用 codex-history skill 预览 session-id 为 019c4040-xxxx 的对话

使用 codex-history skill 导出 session-id 为 019c4040-xxxx 的对话到 Markdown 内容文件（包含 sessionId、来源、时间与交替式消息记录）

使用 codex-history skill 删除 session-id 为 019c4040-xxxx 的对话

使用 codex-history skill 以表格列出全部对话，然后删除全部对话信息

使用 codex-history skill 归档 session-id 为 019c4040-xxxx 的对话

使用 codex-history skill 恢复 session-id 为 019c4040-xxxx 的误归档对话

使用 codex-history skill 以 JSON 格式输出最近 20 条会话
```
