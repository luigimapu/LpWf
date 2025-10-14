# LpWf – Gestionale + Hub Catalogo

[![CI](https://github.com/luigimapu/LpWf/actions/workflows/ci.yml/badge.svg)](https://github.com/luigimapu/LpWf/actions/workflows/ci.yml)
[![Deploy](https://github.com/luigimapu/LpWf/actions/workflows/deploy.yml/badge.svg)](https://github.com/luigimapu/LpWf/actions/workflows/deploy.yml)
[![Production](https://img.shields.io/badge/env-production-green)](https://www.lprent.it/LpWF_refactor/)
[![Staging](https://img.shields.io/badge/env-staging-blue)](https://www.lprent.it/LpWf_staging/)

## Panoramica

- Gestionale multi-tenant con hub centrale per catalogo/marketplace.
- API applicative in `/api`, endpoint hub read-only in `/hub_catalogo`.

## Setup rapido

- Copia `.env.example` in `.env` e compila.
- Esegui:
    - `php tools/setup_hub_db.php`
    - `php tools/setup_tenant_db.php`
- Test hub (read-only): `/hub_catalogo/index.php?path=articoli`
- Test API (autenticate): `/api/*`

## Riferimenti API e Test

- Documentazione endpoint: `docs/API_REFERENCE.md`
- Console Test API: `api_test.html`
- Test Servizi integrazione: `services_test.html`

## Contribuire

Vedi `CONTRIBUTING.md`, `docs/DEV_SETUP.md` e `docs/DEPLOY_PLESK.md`.

## Ambienti

- Produzione: https://www.lprent.it/LpWF_refactor/
    - Hub catalogo: https://www.lprent.it/LpWF_refactor/hub_catalogo/index.php?path=articoli
- Staging: https://www.lprent.it/LpWf_staging/
    - Hub catalogo: https://www.lprent.it/LpWf_staging/hub_catalogo/index.php?path=articoli

## Quick links

Produzione

- Login: https://www.lprent.it/LpWF_refactor/login.html
- Dashboard: https://www.lprent.it/LpWF_refactor/mia_dashboard.html
- API health: https://www.lprent.it/LpWF_refactor/api/health
- Tenant health: https://www.lprent.it/LpWF_refactor/api/tenant_health
- Hub (read-only): https://www.lprent.it/LpWF_refactor/hub_catalogo/index.php?path=articoli

Staging

- Login: https://www.lprent.it/LpWf_staging/login.html
- Dashboard: https://www.lprent.it/LpWf_staging/mia_dashboard.html
- API health: https://www.lprent.it/LpWf_staging/api/health
- Tenant health: https://www.lprent.it/LpWf_staging/api/tenant_health
- Hub (read-only): https://www.lprent.it/LpWf_staging/hub_catalogo/index.php?path=articoli

Autenticazione API

- Endpoint login: `POST /api/auth/login` (body JSON: `{ "email": "...", "password": "..." }`)
- Le richieste successive includono header `Authorization: Bearer <token>`
