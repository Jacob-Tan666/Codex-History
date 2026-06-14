---
name: codex-history
description: 在 Codex 对话中管理本机历史会话，支持本地可视化 UI、表格列表、preview、export、archive、recover、按 session-id 删除或批量删除，并同步清理 history.jsonl。
---

# Codex History Skill

## 适用场景

- 查看本机 Codex 会话历史。
- 通过本地 Web UI 搜索、筛选、预览、导出、归档、恢复或删除会话。
- 以表格形式列出会话来源、时间、标题、`sessionId` 和文件路径。
- 导出指定会话为 Markdown。
- 将活跃会话归档到 `archived_sessions`。
- 将归档会话恢复到 `sessions/YYYY/MM/DD`。
- 按明确的 `session-id` 删除会话，并同步清理 `history.jsonl`。
- 在 UI 中勾选多个会话后批量删除。

## 能力边界

- 默认读取 `CODEX_HOME`，未设置时回退到 `~/.codex`。
- 只处理会话相关数据：`sessions`、`archived_sessions`、`history.jsonl`。
- `ui` 只启动本地回环地址上的控制台，默认地址为 `http://127.0.0.1:17876/`。
- `export` 只允许写入当前项目工作目录内的相对路径。
- `delete` 是物理删除，执行后不可恢复，除非用户有外部备份。

## 命令白名单

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

## 删除护栏

1. 删除指定会话必须提供明确且非空的 `session-id`。
2. 删除前必须提醒用户：删除是物理删除且不可恢复。
3. 执行删除必须包含 `--force` 或 UI 等价确认。
4. `--all` 不能与 `--session-id` 混用。
5. 删除后返回删除摘要：`all`、`sessionCount`、`sessionFileCount`、`deletedFiles`、`failedFiles`、`removedHistoryLines`。
