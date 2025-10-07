# AGENTS – Istruzioni per agenti & tool automatizzati

## Scope
Queste regole si applicano a tutto il repo.

## Stile & Convenzioni
- PHP: 4 spazi; JS/HTML/CSS: 2 spazi (`.editorconfig`).
- Non introdurre breaking changes nello schema DB. Migrazioni idempotenti in `tools/setup_*_db.php`.
- Mantieni l'endpoint `hub_catalogo` read-only e backwards compatible.

## Modifica file
- UI: `mia_dashboard.html`, `dashboard.js`, `assets/**` (coerenza con ESLint/Prettier).
- Backend/API: `api/**`, `hub_catalogo/**`, `tools/**`, `database/**`.
- Aggiorna `docs/DEV_SETUP.md` per nuove istruzioni dev; aggiorna `.env.example` per nuove env.

## PR & Branching
- Usa branch `feat/...`, `fix/...` e apri PR verso `main`.
- Compila il template PR e attendi review.

## Test
- Hub: `hub_catalogo/index.php?path=articoli` per verifiche rapide.
- API: `/api/*` con token autenticato.

