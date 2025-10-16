#!/usr/bin/env bash
set -euo pipefail

# Move to repo root
cd "$(dirname "$0")/.."

# Ensure log dir exists
mkdir -p out
LOCKFILE="out/sync_push.lock"
LOGFILE="out/sync_push.log"

# Resolve PHP binary
PHP_BIN_ENV="${PHP_BIN:-}"
php_candidates=(
  "$PHP_BIN_ENV"
  "/opt/plesk/php/8.3/bin/php"
  "/usr/bin/php"
  "/usr/local/bin/php"
  "php"
)
PHP_BIN_RESOLVED=""
for c in "${php_candidates[@]}"; do
  if [ -n "$c" ]; then
    if [ "$c" = "php" ]; then
      if command -v php >/dev/null 2>&1; then PHP_BIN_RESOLVED="$(command -v php)"; break; fi
    elif [ -x "$c" ]; then
      PHP_BIN_RESOLVED="$c"; break;
    fi
  fi
done
if [ -z "$PHP_BIN_RESOLVED" ]; then
  echo "ERROR: PHP binary not found" >&2
  exit 1
fi

# Single instance via flock
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  exit 0
fi

ts() { date -Is; }
echo "[$(ts)] sync_push start" >> "$LOGFILE"
"$PHP_BIN_RESOLVED" tools/sync_push.php 50 >> "$LOGFILE" 2>&1 || true
echo "[$(ts)] sync_push end" >> "$LOGFILE"

