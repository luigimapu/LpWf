#!/usr/bin/env bash
set -euo pipefail

# Manual deploy helper: pulls code and runs DB setup.
# Usage:
#   bash tools/deploy_manual.sh [--branch <name>] [--no-db] [--php </path/to/php>]
# Defaults:
#   - branch: autodetects 'main' if it exists on origin, otherwise 'staging'
#   - php: /opt/plesk/php/8.3/bin/php if present, else 'php'

usage() {
  cat <<'USAGE'
Manual deploy script

Options:
  -b, --branch <name>    Branch da deployare (default: autodetect main/staging)
      --no-db            Salta gli script di setup DB
      --php <path>       Path PHP CLI (default: /opt/plesk/php/8.3/bin/php o php)
  -h, --help             Mostra questo aiuto

Esempi:
  bash tools/deploy_manual.sh
  bash tools/deploy_manual.sh --branch main
  bash tools/deploy_manual.sh -b staging --no-db
USAGE
}

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BRANCH=""
RUN_DB=true
PHP_BIN_OPT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)
      [[ $# -ge 2 ]] || { echo "Errore: manca il valore per $1" >&2; exit 2; }
      BRANCH="$2"; shift 2;;
    --no-db)
      RUN_DB=false; shift;;
    --php)
      [[ $# -ge 2 ]] || { echo "Errore: manca il valore per $1" >&2; exit 2; }
      PHP_BIN_OPT="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Opzione sconosciuta: $1" >&2; usage; exit 2;;
  esac
done

remote_has_branch() {
  local b="$1"
  git ls-remote --heads origin "$b" >/dev/null 2>&1 && \
  git ls-remote --heads origin "$b" | grep -q "refs/heads/$b"
}

if [[ -z "$BRANCH" ]]; then
  if remote_has_branch main; then BRANCH=main; else BRANCH=staging; fi
fi

if [[ -n "$PHP_BIN_OPT" ]]; then
  PHP_BIN="$PHP_BIN_OPT"
elif command -v /opt/plesk/php/8.3/bin/php >/dev/null 2>&1; then
  PHP_BIN="/opt/plesk/php/8.3/bin/php"
else
  PHP_BIN="php"
fi

echo "Repo: $ROOT_DIR"
echo "Branch: $BRANCH"
echo "PHP_BIN: $PHP_BIN"

if [[ ! -f .env ]]; then
  echo "[AVVISO] File .env non trovato in $ROOT_DIR. Gli script DB proveranno a usare i valori di default." >&2
fi

echo "== Git: fetch/prune =="
git fetch origin --prune

echo "== Git: checkout $BRANCH =="
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
elif remote_has_branch "$BRANCH"; then
  git checkout -B "$BRANCH" "origin/$BRANCH"
else
  echo "Errore: la branch '$BRANCH' non esiste su origin e non è presente localmente." >&2
  exit 3
fi

echo "== Git: fast-forward pull =="
git pull --ff-only origin "$BRANCH"

if $RUN_DB; then
  echo "== DB setup: hub =="
  "$PHP_BIN" tools/setup_hub_db.php
  echo "== DB setup: tenant =="
  "$PHP_BIN" tools/setup_tenant_db.php
else
  echo "(skip) DB setup disattivato con --no-db"
fi

echo "OK: deploy manuale completato."

