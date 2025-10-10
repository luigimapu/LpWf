#!/usr/bin/env bash
set -euo pipefail

# Minimal post-deploy script for Plesk Git or manual SSH deploys.
# Runs hub and tenant DB setup using Plesk PHP 8.3 if available,
# otherwise falls back to the default php in PATH.

PHP_BIN_DEFAULT="/opt/plesk/php/8.3/bin/php"
PHP_BIN_ENV="${PHP_BIN:-}"

if [ -n "$PHP_BIN_ENV" ]; then
  PHP_BIN_CMD="$PHP_BIN_ENV"
elif [ -x "$PHP_BIN_DEFAULT" ]; then
  PHP_BIN_CMD="$PHP_BIN_DEFAULT"
else
  PHP_BIN_CMD="php"
fi

echo "Using PHP_BIN: $PHP_BIN_CMD"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

set -x
"$PHP_BIN_CMD" "$ROOT_DIR/tools/setup_hub_db.php"
"$PHP_BIN_CMD" "$ROOT_DIR/tools/setup_tenant_db.php"
set +x

echo "Post-deploy completed."

