#!/usr/bin/env sh
set -eu

SKILL_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NODE_BIN=${CODEX_HISTORY_NODE:-}

if [ -z "$NODE_BIN" ] && command -v node >/dev/null 2>&1; then
  NODE_BIN=$(command -v node)
fi

if [ -z "$NODE_BIN" ] && [ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]; then
  NODE_BIN="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi

if [ -z "$NODE_BIN" ]; then
  echo "Node.js 18 or newer was not found." >&2
  echo "Install Node.js or set CODEX_HISTORY_NODE to the node executable." >&2
  exit 1
fi

exec "$NODE_BIN" "$SKILL_DIR/scripts/start-ui.js" "$@"
