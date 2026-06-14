# Changelog

## [0.4.1] - 2026-06-14

### Changed

- Switched the dashboard from a dark console theme to a bright glass workspace.
- Rewrote the Chinese README with a more product-oriented GitHub homepage style.

## [0.4.0] - 2026-06-14

### Added

- Redesigned the local dashboard with a dark console-style interface.
- Added checkbox selection for visible sessions.
- Added batch deletion in the local UI through `/api/delete` with a `sessionIds` payload.

### Changed

- Rewrote UI-facing copy so the dashboard and server responses render readable Chinese text.
- Added lightweight package metadata and repository hygiene files.

## [0.3.0] - 2026-06-14

### Added

- Added the `ui` command for starting a local Web dashboard.
- Added search, source filtering, preview, Markdown export, archive, recover, and delete actions in the visual UI.

### Changed

- Packaged `public/` frontend assets with `ui-server.js`.
- Updated docs with local UI usage and whitelist notes.

## [0.2.0] - 2026-03-20

### Added

- Added `export` for saving a session as Markdown.
- Added JSON and human-readable export summaries.

### Changed

- `list` defaults to active `sessions`; `--source archived` and `--source all` expose other scopes.
- Export now uses a single Markdown format with session metadata and user/assistant messages.

## [0.1.0] - 2026-02-09

### Added

- Initial `codex-history-skill` release.
- Added list, preview, archive, recover, and delete commands.
