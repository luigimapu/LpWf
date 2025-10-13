#!/usr/bin/env bash
set -euo pipefail

# Add a GitHub collaborator to the current repository with a given permission.
# Requires: gh (GitHub CLI) authenticated.
#
# Usage:
#   bash tools/gh_add_collaborator.sh --user <github_username> [--permission <perm>] [--repo <owner/repo>]
#
# Permissions: pull | triage | push | maintain | admin
# Default permission: admin

usage() {
  cat <<'USAGE'
Add a GitHub collaborator to this repo

Options:
  --user <username>        GitHub handle dell'utente (es: damato89) [obbligatorio]
  --permission <perm>      pull|triage|push|maintain|admin (default: admin)
  --repo <owner/repo>      Repo target (default: dedotto da git remote origin)
  -h, --help               Mostra questo aiuto

Esempi:
  bash tools/gh_add_collaborator.sh --user damato89
  bash tools/gh_add_collaborator.sh --user alice --permission push
  bash tools/gh_add_collaborator.sh --user bob --repo yourorg/yourrepo --permission maintain
USAGE
}

USER=""
PERM="admin"
REPO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)
      [[ $# -ge 2 ]] || { echo "Errore: manca il valore per --user" >&2; exit 2; }
      USER="$2"; shift 2;;
    --permission)
      [[ $# -ge 2 ]] || { echo "Errore: manca il valore per --permission" >&2; exit 2; }
      PERM="$2"; shift 2;;
    --repo)
      [[ $# -ge 2 ]] || { echo "Errore: manca il valore per --repo" >&2; exit 2; }
      REPO="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Opzione sconosciuta: $1" >&2; usage; exit 2;;
  esac
done

if [[ -z "$USER" ]]; then
  echo "Errore: --user è obbligatorio" >&2
  usage; exit 2
fi

if [[ -z "$REPO" ]]; then
  # Deduce owner/repo da git remote origin
  ORIGIN_URL=$(git config --get remote.origin.url || true)
  if [[ -z "$ORIGIN_URL" ]]; then
    echo "Errore: impossibile dedurre il repo (git remote origin mancante). Usa --repo <owner/repo>." >&2
    exit 2
  fi
  # Normalizza in https://github.com/owner/repo
  if [[ "$ORIGIN_URL" =~ ^git@github.com:(.*)\.git$ ]]; then
    REPO="${BASH_REMATCH[1]}"
  elif [[ "$ORIGIN_URL" =~ ^https://github.com/(.*)\.git$ ]]; then
    REPO="${BASH_REMATCH[1]}"
  elif [[ "$ORIGIN_URL" =~ ^https://github.com/(.*)$ ]]; then
    REPO="${BASH_REMATCH[1]}"
  else
    echo "Errore: formato remote origin non riconosciuto: $ORIGIN_URL" >&2
    exit 2
  fi
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Errore: 'gh' (GitHub CLI) non trovato nel PATH." >&2
  exit 2
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Errore: gh non autenticato. Esegui: gh auth login" >&2
  exit 2
fi

echo "Repo: $REPO"
echo "Utente: @$USER"
echo "Permessi: $PERM"

# Invita/aggiunge il collaboratore con il livello richiesto
echo "Invito collaboratore con permesso '$PERM'…"
gh api -X PUT \
  "/repos/$REPO/collaborators/$USER" \
  -f permission="$PERM" >/dev/null

echo "Invito inviato. Se l'utente non è già collaboratore, dovrà accettare l'invito via GitHub."

# Prova a leggere il permesso corrente (potrebbe risultare 'none' finché l'invito non è accettato)
echo "Verifica permessi attuali (potrebbe risultare 'none' finché l'invito non è accettato)…"
gh api \
  "/repos/$REPO/collaborators/$USER/permission" \
  --jq '.permission' || true

echo "Completato."

