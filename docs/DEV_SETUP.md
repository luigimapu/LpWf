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

## Deploy via Actions (SSH)

Prerequisiti

- Secrets del repo (Settings → Secrets → Actions):
    - `SSH_HOST_STAGING`, `SSH_HOST_PROD`, `SSH_PORT`, `SSH_USER`
    - `DEPLOY_PATH_STAGING`, `DEPLOY_PATH_PROD`, `PHP_BIN`
    - `SSH_KEY` (privata ED25519) oppure `SSH_KEY_B64` (stessa chiave, base64)
    - (Opzionale) `SSH_KNOWN_HOSTS` da `ssh-keyscan -p <porta> <host>`

Chiavi SSH e utente

- `SSH_USER` deve essere l'utente di sistema Plesk proprietario del path di deploy (es. `admin_prova`).
- Installa la CHIAVE PUBBLICA corrispondente al secret in `~$SSH_USER/.ssh/authorized_keys` (o via Plesk → SSH Keys).
- Permessi: `chmod 700 ~/.ssh` e `chmod 600 ~/.ssh/authorized_keys` (owner: `$SSH_USER`).
- Il workflow forza l'identity: `ssh -i $HOME/.ssh/deploy_key -o IdentitiesOnly=yes`.

known_hosts

- Se `SSH_KNOWN_HOSTS` è impostato, viene usato con `StrictHostKeyChecking=yes`.
- Se assente, il workflow esegue `ssh-keyscan` su host/porta (formato `[host]:port` se porta ≠ 22); in fallback usa `StrictHostKeyChecking=accept-new`.

Trigger workflow

- Push su `staging` → deploy su `DEPLOY_PATH_STAGING`.
- Push su `main` → deploy su `DEPLOY_PATH_PROD`.
- Manuale: Actions → `Deploy` → `Run workflow` con input `target` (`staging`/`production`).

Post-deploy

- Esegue: `${PHP_BIN} tools/setup_hub_db.php` e `${PHP_BIN} tools/setup_tenant_db.php`.

Troubleshooting rapido

- `Permission denied (publickey,...)`: chiave pubblica non installata per `SSH_USER` o `SSH_USER` errato.
- `Host key verification failed`: rigenera `SSH_KNOWN_HOSTS` con `ssh-keyscan` per host/porta corretti.

## Deploy manuale da terminale

Per evitare Plesk Git o Actions, puoi fare deploy direttamente da terminale sul server.

- Script helper: `bash tools/deploy_manual.sh`
    - Opzioni:
        - `-b, --branch <name>`: branch da deployare (default auto: `main` se esiste, altrimenti `staging`).
        - `--no-db`: non esegue gli script di setup DB.
        - `--php </path/to/php>`: specifica il binario PHP (default: `/opt/plesk/php/8.3/bin/php` o `php`).
    - Esempi:
        - `bash tools/deploy_manual.sh`
        - `bash tools/deploy_manual.sh --branch main`
        - `bash tools/deploy_manual.sh -b staging --no-db`

Requisiti

- `.env` presente nella root del progetto con credenziali DB (vedi `.env.example`).
- L'utente del server deve avere accesso al repo Git remoto (origin) per `fetch/pull`.
