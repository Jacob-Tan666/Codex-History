# Codex History Skill

[中文](./README.md) | English

## 1. Overview

`Codex History Skill` helps you manage local Codex conversation history, including table-based listing, previewing, exporting, archiving, recovering, deleting selected sessions, and deleting all conversation data.

## 2. Features

- List session history (shows active `sessions` by default, with `--source archived|all` for archived-only or all sessions)
- Show session title in table output with source, time, `sessionId`, and file path (falls back to `sessionId` when title is empty)
- Preview session content by `session-id`
- Export a specific session to a Markdown content file, with the output path restricted to the current project working directory; the exported file includes `sessionId`, source, time, and user/assistant messages laid out in chronological order
- Archive specific sessions (`sessions` -> `archived_sessions`)
- Recover archived sessions (`archived_sessions` -> `sessions/YYYY/MM/DD`)
- Delete specific sessions and remove corresponding entries in `history.jsonl`
- Delete all conversation data with `delete --all --force`, including session files under `sessions` / `archived_sessions` and all lines in `history.jsonl`
- Provide a local visual web dashboard for searching, filtering, previewing, exporting, archiving, recovering, and deleting sessions
- Support both human-readable output and `--json` output
- When `--json` is used, both success and failure responses are returned as structured JSON for automation

## 2.1 Important Notice (Delete is irreversible)

- `delete` performs a **physical deletion**: it removes session files directly and deletes related lines from `history.jsonl`.
- `delete --all --force` performs a **full physical deletion**: it removes every `.jsonl` session file under `sessions` and `archived_sessions`, then clears `history.jsonl`.
- `delete` requires an explicit `--force`; otherwise the CLI returns a parameter error immediately.
- `--all` cannot be combined with `--session-id`.
- Deletion is **irreversible by default**. Please use it only when you are sure.
- If you need a reversible workflow, use `archive` first and `recover` for rollback.
- When `archive` / `recover` hits an existing target file, the CLI skips it as a conflict by default; use `--force` to overwrite the target first.

## 3. Installation

1) Download `codex-history-skill.zip` from GitHub Releases.  
2) Extract it to `~/.codex/skills` (the zip already contains the `codex-history/` top-level folder).  
3) Restart Codex.  
4) Ask Codex to use this skill in conversation.

Windows (PowerShell):

```powershell
$skillDir = "$env:USERPROFILE\.codex\skills"
New-Item -ItemType Directory -Force $skillDir | Out-Null
Expand-Archive -Path .\codex-history-skill.zip -DestinationPath $skillDir -Force
```

macOS / Linux:

```bash
mkdir -p ~/.codex/skills
unzip codex-history-skill.zip -d ~/.codex/skills
```

## 3.1 CLI Quick Reference

```bash
# Start the local visual dashboard
node scripts/history-cli.js ui --open

# List recent active sessions (top 10)
node scripts/history-cli.js list --limit 10

# List sessions as a table for delete/keep decisions
node scripts/history-cli.js list --source all --format table

# List sessions in the old detailed layout
node scripts/history-cli.js list --format detail --limit 10

# List all sessions, including archived ones
node scripts/history-cli.js list --source all --limit 10

# List archived sessions only
node scripts/history-cli.js list --source archived --limit 10

# Preview a session
node scripts/history-cli.js preview --session-id <id>

# Preview a session and return JSON
node scripts/history-cli.js preview --session-id <id> --json

# Export a session to Markdown (includes sessionId, source, time, and alternating messages)
node scripts/history-cli.js export --session-id <id> --output ./exports/session.md

# Archive a session
node scripts/history-cli.js archive --session-id <id>

# Archive a session and overwrite on conflict
node scripts/history-cli.js archive --session-id <id> --force

# Recover an archived session
node scripts/history-cli.js recover --session-id <id>

# Recover an archived session and overwrite on conflict
node scripts/history-cli.js recover --session-id <id> --force

# Delete a session (physical deletion, irreversible)
node scripts/history-cli.js delete --session-id <id> --force

# Delete all conversation data (physical deletion, irreversible)
node scripts/history-cli.js delete --all --force
```

## 3.2 Visual Dashboard

After startup, open `http://127.0.0.1:17876/`:

- Filter by `sessions`, `archived`, or `all`, and search by title, `sessionId`, or file path.
- Preview messages, export Markdown, archive, recover, or delete from the detail pane.
- Deletion is still a physical irreversible delete, and the dashboard asks for confirmation before running it.

## 3.3 Export behavior

- `export` now uses a single export format: the file header always contains `sessionId`, source, and time.
- The body outputs real `user/assistant` messages in original chronological order, with a timestamp and fenced code block for each message.
- `system` messages are not exported into the body; boilerplate wrapper content is also excluded from the body by default.
- `--max-messages` counts only the effective messages that are actually written to the body.

## 3.4 Compatibility

- Node.js `>=14.0.0`
- Node.js 18+ is recommended

## 4. Examples

```text
Use codex-history skill to list recent conversations

Use codex-history skill to preview session-id 019c4040-xxxx

Use codex-history skill to export session-id 019c4040-xxxx to a Markdown content file (including sessionId, source, time, and alternating messages)

Use codex-history skill to delete session-id 019c4040-xxxx

Use codex-history skill to show all sessions as a table, then delete all conversation data

Use codex-history skill to archive session-id 019c4040-xxxx

Use codex-history skill to recover mistakenly archived session-id 019c4040-xxxx

Use codex-history skill to output the latest 20 sessions in JSON format
```
