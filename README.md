# Codex History Skill

中文 | [English](./README.en.md)

`Codex History Skill` 用于管理本机 Codex 会话历史，支持命令行查看、预览、导出、归档、恢复、删除，以及本地 Web 可视化控制台。

## 功能

- 列出本地 `sessions` 与 `archived_sessions` 会话。
- 按标题、`sessionId`、来源和文件路径搜索。
- 预览会话消息。
- 导出指定会话为 Markdown。
- 归档活跃会话，或恢复已归档会话。
- 按 `session-id` 精确物理删除会话，并同步清理 `history.jsonl`。
- 本地 UI 支持勾选多个会话后批量删除。

## 重要提醒

`delete` 是物理删除，会直接移除会话文件并从 `history.jsonl` 删除对应记录，默认不可恢复。需要可撤销流程时，请优先使用 `archive`，再通过 `recover` 恢复。

## 启动可视化界面

```bash
node scripts/history-cli.js ui --open
```

默认地址：

```text
http://127.0.0.1:17876/
```

界面能力：

- 左侧按来源筛选：全部、活跃、归档。
- 搜索标题、`sessionId` 或文件路径。
- 勾选当前列表中的一个或多个会话。
- 点击“删除勾选”执行批量删除。
- 右侧预览单个会话，并可导出、归档、恢复或删除。

## CLI 快速参考

```bash
# 列出最近活跃会话
node scripts/history-cli.js list --limit 10

# 列出全部会话
node scripts/history-cli.js list --source all --format table

# 预览会话
node scripts/history-cli.js preview --session-id <id>

# 导出会话
node scripts/history-cli.js export --session-id <id> --output ./exports/session.md

# 归档会话
node scripts/history-cli.js archive --session-id <id>

# 恢复归档会话
node scripts/history-cli.js recover --session-id <id>

# 删除指定会话
node scripts/history-cli.js delete --session-id <id> --force

# 删除全部会话数据
node scripts/history-cli.js delete --all --force
```

## 兼容性

- Node.js `>=14.0.0`
- 推荐 Node.js 18 或更高版本
