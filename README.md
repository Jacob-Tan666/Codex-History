# Codex History

一块给 Codex 本地会话准备的明亮控制台。

它把 `~/.codex` 里的历史会话整理成一个可以搜索、预览、导出、归档、恢复和删除的本地工具。你可以把它当作 Codex 的“会话驾驶舱”：不用翻目录，不用猜文件名，也不用在一堆 `.jsonl` 里找线索。

## 亮点

- **本地可视化 UI**：默认运行在 `http://127.0.0.1:17876/`，浅色玻璃质感界面，适合长时间查看。
- **快速定位会话**：按标题、`sessionId`、来源和文件路径搜索。
- **一屏管理状态**：活跃会话、归档会话、当前筛选数量和已勾选数量都在侧栏展示。
- **批量勾选删除**：支持全选当前列表，再一次性删除勾选会话。
- **安全边界清晰**：只处理 `sessions`、`archived_sessions` 和 `history.jsonl`。
- **Markdown 导出**：把重要对话整理成可收藏、可提交、可分享的 `.md` 文件。

## 界面工作流

```bash
node scripts/history-cli.js ui --open
```

打开后你可以：

1. 在左侧切换 `全部 / 活跃 / 归档`。
2. 用搜索框按标题、`sessionId` 或文件路径过滤。
3. 勾选一个或多个会话，使用“删除勾选”批量清理。
4. 点击单个会话，在右侧预览消息。
5. 对当前会话执行导出、归档、恢复或删除。

删除是物理删除，会移除会话文件并清理 `history.jsonl` 中的对应记录。需要保留退路时，优先使用归档。

## CLI

```bash
# 启动本地 UI
node scripts/history-cli.js ui --open

# 列出最近活跃会话
node scripts/history-cli.js list --limit 10

# 以表格列出全部会话
node scripts/history-cli.js list --source all --format table

# 预览指定会话
node scripts/history-cli.js preview --session-id <id>

# 导出为 Markdown
node scripts/history-cli.js export --session-id <id> --output ./exports/session.md

# 归档 / 恢复
node scripts/history-cli.js archive --session-id <id>
node scripts/history-cli.js recover --session-id <id>

# 删除指定会话
node scripts/history-cli.js delete --session-id <id> --force
```

## 数据范围

默认读取 `CODEX_HOME`。如果没有设置，则使用：

```text
~/.codex
```

涉及的数据目录：

- `sessions`
- `archived_sessions`
- `history.jsonl`

## 兼容性

- Node.js 14+
- 推荐 Node.js 18+

## 许可

MIT
