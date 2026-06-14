# Codex History

Codex History 是一个用于管理本机 Codex 会话历史的本地工具。它提供命令行接口和 Web 可视化界面，帮助用户查看、筛选、预览、导出、归档、恢复和删除 Codex 产生的本地会话记录。

项目的设计目标是明确的：**只处理 Codex 本地历史数据，不接入远程服务，不上传会话内容，不修改业务项目文件**。所有读写操作都限制在 `CODEX_HOME` 下的会话数据目录，以及用户显式指定的项目内导出路径。

## 适用场景

Codex 的本地历史通常存放在 `~/.codex` 目录下，真实会话文件是 `.jsonl` 格式。随着使用时间增加，会话数量会快速变多，直接在文件系统中查找、判断、清理会变得不方便。

Codex History 适合以下场景：

- 查找某次历史对话对应的 `sessionId`。
- 按标题、路径或来源筛选会话。
- 快速预览某个会话中的用户和助手消息。
- 将重要会话导出为 Markdown 归档。
- 将暂时不需要的会话移动到归档目录。
- 从归档目录恢复误归档的会话。
- 明确确认后删除指定会话或批量删除选中的会话。

它不适合做以下事情：

- 备份或恢复整个 Codex 环境。
- 修改 Codex 配置、模型设置或登录状态。
- 同步远程历史记录。
- 分析、训练或上传会话内容。
- 管理当前项目中的源码文件。

## 功能概览

### Web 可视化界面

本地 UI 默认运行在：

```text
http://127.0.0.1:17876/
```

界面包含三个主要区域：

- 左侧筛选栏：显示总数、当前可见数量、已勾选数量，并提供搜索、来源筛选和加载数量设置。
- 中间会话列表：显示匹配到的会话卡片，支持单选预览和复选勾选。
- 右侧详情面板：显示当前会话的来源、标题、时间、文件路径和消息预览，并提供导出、归档、恢复、删除操作。

UI 支持批量删除：勾选多个会话后，会出现批量操作栏。点击“删除勾选”会先弹出确认框，确认后才会调用删除接口。

### 命令行接口

CLI 支持以下命令：

- `ui`
- `list`
- `preview`
- `export`
- `archive`
- `recover`
- `delete`

命令可以输出人类可读格式，也可以通过 `--json` 输出结构化 JSON，便于脚本集成。

### Markdown 导出

导出功能会把指定会话保存为 Markdown 文件。导出的内容包含：

- 会话标题
- `sessionId`
- 来源
- 时间
- 按原始顺序排列的用户和助手消息

默认不会把系统消息和无效包装内容重复写入正文。

## 安装与运行

### 环境要求

- Node.js 14 或更高版本
- 推荐 Node.js 18 或更高版本

本项目没有外部 npm 依赖，直接使用 Node.js 运行即可。

### 启动 Web UI

在项目目录中运行：

```bash
node scripts/history-cli.js ui --open
```

如果不希望自动打开浏览器：

```bash
node scripts/history-cli.js ui
```

指定端口：

```bash
node scripts/history-cli.js ui --host 127.0.0.1 --port 17876
```

### 运行检查

如果安装了 Node.js，可以运行：

```bash
npm run check
```

该命令会对主要脚本执行 `node --check` 语法检查。

## 数据目录

默认读取 `CODEX_HOME` 环境变量：

```bash
CODEX_HOME=/path/to/.codex
```

如果没有设置 `CODEX_HOME`，则使用当前用户目录下的：

```text
~/.codex
```

Codex History 只访问以下数据：

| 路径 | 用途 |
| --- | --- |
| `sessions/` | 活跃会话文件，通常按日期分层存放 |
| `archived_sessions/` | 已归档会话文件 |
| `history.jsonl` | Codex 历史索引，包含会话标题和时间等信息 |

## Web UI 使用说明

### 1. 筛选来源

来源筛选包含三种：

| 来源 | 含义 |
| --- | --- |
| `全部` | 同时显示活跃和归档会话 |
| `活跃` | 只显示 `sessions` 中的会话 |
| `归档` | 只显示 `archived_sessions` 中的会话 |

### 2. 搜索会话

搜索框会匹配以下字段：

- 标题
- `sessionId`
- 文件路径
- 来源

搜索只在当前已加载的数据范围内执行。如果需要查看更多记录，可以调高“加载数量”。

### 3. 预览会话

点击会话卡片主体会在右侧打开详情。详情会显示：

- 会话来源
- 会话标题
- 时间
- `sessionId`
- 原始文件路径
- 可预览消息列表

### 4. 归档和恢复

活跃会话可以归档。归档后文件会从：

```text
sessions/
```

移动到：

```text
archived_sessions/
```

已归档会话可以恢复。恢复时会根据文件名或会话元数据中的时间推断目标日期目录，并放回：

```text
sessions/YYYY/MM/DD/
```

### 5. 删除会话

删除是物理删除。它会执行两件事：

1. 删除对应 `.jsonl` 会话文件。
2. 从 `history.jsonl` 中移除对应 `session_id` 的记录。

删除后默认不可恢复。除非你有外部备份，否则无法通过本工具撤销删除。

## CLI 参考

### 启动 UI

```bash
node scripts/history-cli.js ui [--host 127.0.0.1] [--port 17876] [--open]
```

示例：

```bash
node scripts/history-cli.js ui --open
```

### 列出会话

```bash
node scripts/history-cli.js list [--source all|sessions|archived] [--limit N] [--format table|detail] [--json]
```

示例：

```bash
node scripts/history-cli.js list --limit 20
node scripts/history-cli.js list --source all --format table
node scripts/history-cli.js list --source archived --format detail
node scripts/history-cli.js list --source all --json
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| `--source` | 数据来源，可选 `all`、`sessions`、`archived` |
| `--limit` | 限制输出数量 |
| `--format` | 人类可读输出格式，可选 `table` 或 `detail` |
| `--json` | 输出结构化 JSON |

### 预览会话

```bash
node scripts/history-cli.js preview --session-id <id> [--max-messages N] [--json]
```

示例：

```bash
node scripts/history-cli.js preview --session-id 019ec648-d241-79b3-9d2e-228fa3d72583
node scripts/history-cli.js preview --session-id 019ec648-d241-79b3-9d2e-228fa3d72583 --max-messages 10
```

### 导出会话

```bash
node scripts/history-cli.js export --session-id <id> --output <file> [--format md] [--max-messages N] [--json]
```

示例：

```bash
node scripts/history-cli.js export --session-id 019ec648-d241-79b3-9d2e-228fa3d72583 --output exports/session.md
```

导出路径必须是当前项目目录内的相对路径。绝对路径和跳出项目目录的路径会被拒绝。

### 归档会话

```bash
node scripts/history-cli.js archive --session-id <id> [--session-id <id> ...] [--force] [--json]
```

示例：

```bash
node scripts/history-cli.js archive --session-id 019ec648-d241-79b3-9d2e-228fa3d72583
```

如果目标位置已存在同名文件，默认跳过。传入 `--force` 后会覆盖目标文件。

### 恢复会话

```bash
node scripts/history-cli.js recover --session-id <id> [--session-id <id> ...] [--force] [--json]
```

示例：

```bash
node scripts/history-cli.js recover --session-id 019ec648-d241-79b3-9d2e-228fa3d72583
```

### 删除会话

```bash
node scripts/history-cli.js delete --session-id <id> [--session-id <id> ...] --force [--json]
```

示例：

```bash
node scripts/history-cli.js delete --session-id 019ec648-d241-79b3-9d2e-228fa3d72583 --force
node scripts/history-cli.js delete --session-id id-1 --session-id id-2 --force
```

全量删除：

```bash
node scripts/history-cli.js delete --all --force
```

全量删除会删除 `sessions` 和 `archived_sessions` 下所有 `.jsonl` 会话文件，并清空 `history.jsonl`。请只在你明确知道后果时使用。

## 删除行为与风险

删除操作遵循以下约束：

- 必须提供明确的 `sessionId`，或显式使用 `--all`。
- 必须提供 `--force`。
- `--all` 不能和 `--session-id` 混用。
- 删除会话文件后，会同步清理 `history.jsonl` 中对应行。
- 删除失败的文件会出现在返回结果的 `failedFiles` 中。

删除返回摘要包含：

| 字段 | 含义 |
| --- | --- |
| `all` | 是否为全量删除 |
| `sessionCount` | 本次涉及的会话数量 |
| `sessionFileCount` | 本次涉及的会话文件数量 |
| `deletedFiles` | 成功删除的文件数量 |
| `failedFileCount` | 删除失败的文件数量 |
| `failedFiles` | 删除失败的文件列表 |
| `removedHistoryLines` | 从 `history.jsonl` 中移除的行数 |

## 项目结构

```text
codex-history/
  public/
    index.html
    styles.css
    app.js
  scripts/
    history-cli.js
    history-core.js
    ui-server.js
    formatters.js
  SKILL.md
  README.md
  README.en.md
  CHANGELOG.md
  package.json
```

主要文件说明：

| 文件 | 说明 |
| --- | --- |
| `scripts/history-core.js` | 会话索引、消息解析、归档、恢复、删除等核心逻辑 |
| `scripts/history-cli.js` | 命令行参数解析和 CLI 命令入口 |
| `scripts/ui-server.js` | 本地 HTTP 服务和 UI API |
| `scripts/formatters.js` | 表格、预览、导出 Markdown 等格式化逻辑 |
| `public/app.js` | Web UI 状态管理和交互逻辑 |
| `public/styles.css` | Web UI 样式 |
| `public/index.html` | Web UI 页面结构 |

## API 端点

UI 服务提供以下本地接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sessions` | 获取会话列表 |
| `GET` | `/api/session` | 获取单个会话预览 |
| `POST` | `/api/export` | 导出会话 |
| `POST` | `/api/archive` | 归档会话 |
| `POST` | `/api/recover` | 恢复会话 |
| `POST` | `/api/delete` | 删除一个或多个会话 |
| `POST` | `/api/shutdown` | 停止本地 UI 服务 |

`/api/delete` 支持单个会话：

```json
{
  "sessionId": "019ec648-d241-79b3-9d2e-228fa3d72583",
  "force": true
}
```

也支持批量会话：

```json
{
  "sessionIds": ["id-1", "id-2"],
  "force": true
}
```

## 故障排查

### UI 打不开

确认服务是否已经启动：

```bash
node scripts/history-cli.js ui
```

如果端口被占用，换一个端口：

```bash
node scripts/history-cli.js ui --port 17877
```

### 列表为空

检查 `CODEX_HOME` 是否指向正确目录。未设置时默认读取 `~/.codex`。

也可以直接检查目录是否存在：

```bash
ls ~/.codex/sessions
```

### 导出失败

导出路径必须位于当前项目目录内，并且必须是相对路径。例如：

```bash
node scripts/history-cli.js export --session-id <id> --output exports/session.md
```

以下路径会被拒绝：

```text
C:\Users\name\Desktop\session.md
../session.md
```

### 恢复失败

恢复归档会话时，需要能从文件名或 `session_meta.timestamp` 推断日期。如果两者都无法提供有效日期，恢复会失败并返回原因。

## 设计原则

- **本地优先**：所有功能都在本机运行。
- **范围明确**：只处理 Codex 历史相关文件。
- **可审计**：删除、归档、恢复都会返回结构化摘要。
- **低依赖**：不需要数据库、不需要前端构建工具、不需要第三方运行时。
- **谨慎删除**：删除必须明确目标，并要求显式确认。

## 许可

MIT License. See [LICENSE](./LICENSE).
