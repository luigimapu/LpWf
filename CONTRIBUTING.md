# Contributing

Queste linee guida servono per lavorare in modo ordinato in team.

## Branching

- `main`: protetto, solo merge via Pull Request (PR).
- Feature: `feat/<breve-titolo>`
- Fix: `fix/<breve-titolo>`
- Chore/Docs: `chore/<...>`, `docs/<...>`

## Commit message

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(ui): card prodotto con badge`
- `fix(api): null-safe su hub_catalogo`
- `docs: aggiunte istruzioni Plesk`

## Pull Request

- Compila il template PR (scopo, screenshot, cambi DB, test).
- Almeno 1 review approvata prima del merge.
- Niente commit diretti su `main`.

## Aree di responsabilità

- UI: `mia_dashboard.html`, `dashboard.js`, `assets/**`
- Backend/API: `api/**`, `hub_catalogo/**`, `tools/**`, `database/**`, `config/**`
- Condivise: `.env.example`, `docs/**`

## Ambiente & segreti

- Versiona solo `.env.example` con chiavi fittizie/placeholder.
- Non committare `.env` reali.
- Per testare in locale/hosting:
    - Hub: `php tools/setup_hub_db.php`
    - Tenant: `php tools/setup_tenant_db.php`

## Migrazioni DB

- Aggiungi/modifica schema in `database/*_schema.sql`.
- Rendi idempotente la migrazione in `tools/setup_*_db.php` (aggiunta colonne con `ALTER TABLE IF NOT EXISTS` pattern e check in `information_schema`).
- Non rompere tabelle esistenti; usa aggiunte compatibili (colonne nullable/di default).

## Lint & Format

- Prettier/ESLint attivi (JS/HTML/CSS). PHP: indent 4 spazi; JS/HTML 2 spazi.
- `.editorconfig` applica regole di base su tutto il repo.

## Test manuali rapidi

- Hub read-only: `hub_catalogo/index.php?path=articoli[&q=&categoria=&tenant=]`
- API applicative (autenticate): `/api/*` (usa token da login in `auth.js`)
- Media upload: POST `/api/catalog_media/upload` (multipart)

## Rilascio / Deploy

- Staging: usa branch `staging` (vedi `docs/DEPLOY_PLESK.md`).
- Produzione: merge su `main` dopo review.
