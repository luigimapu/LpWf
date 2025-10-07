# Dev Setup (UI + Backend)

## Requisiti

- PHP 8.x con estensioni PDO/MySQL
- MySQL 8.x
- Node (solo per lint/format, opzionale)
- VS Code (consigliato) + estensioni: ESLint, Prettier, EditorConfig

## Ambiente

- Copia `.env.example` in `.env` e compila le variabili locali (senza committarle).
- Hub: `php tools/setup_hub_db.php` (crea DB, schema e seed demo)
- Tenant: `php tools/setup_tenant_db.php`

## Test rapidi

- Hub endpoint read-only:
    - `https://<host>/LpWF_refactor/hub_catalogo/index.php?path=articoli`
    - Filtri: `q`, `categoria`, `tenant`, `tipologia`, `visibilita`
- API applicative (autenticate): `/api/*` (usa login per ottenere token)

## Stile

- JS/HTML/CSS: 2 spazi; PHP: 4 spazi (`.editorconfig`).
- Prettier/ESLint: format on save.

## Branch & PR

- Crea branch `feat/...` o `fix/...` e apri PR con template.
- Non pushare su `main`.
