# Changelog

## [0.4.2] - 2026-07-15

### Fixed

- Restored the `test`, `cli`, and `pack:skill` npm scripts removed during the dashboard redesign.
- Synchronized package-lock metadata with package version 0.4.1 and the supported Node.js range.
- Updated CI and release workflows to current official Action majors and Node.js 24.

## [0.4.1] - 2026-06-14

### Changed

- Switched the dashboard from a dark console theme to a bright glass workspace.
- Rewrote the Chinese README with a more product-oriented GitHub homepage style.
- Expanded the Chinese README into a more complete project manual with usage, CLI reference, API notes, data boundaries, and troubleshooting.

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
