# Dev Setup (UI + Backend)

## Requisiti

- PHP 8.x con estensioni PDO/MySQL
- MySQL 8.x
- Node (solo per lint/format, opzionale)
- VS Code (consigliato) + estensioni: ESLint, Prettier, EditorConfig

## Ambiente

- Copia `.env.example` in `.env` e compila le variabili locali (senza committarle).
- Setup DB (idempotenti):
    - Linux/macOS:
        - `php tools/setup_hub_db.php`
        - `php tools/setup_tenant_db.php`
        - Oppure: `bash tools/deploy_manual.sh --no-db` per solo codice; poi i due comandi PHP.
    - Windows (PowerShell):
        - `./tools/dev_bootstrap.ps1` (Composer deps, npm deps, configura VS Code; opz. `-RunSetup` per DB)
        - `./tools/setup.ps1` (esegue solo gli script DB)
        - Solo Hub: `./tools/setup.ps1 -HubOnly`
        - Solo Tenant: `./tools/setup.ps1 -TenantOnly`
        - PHP custom: `./tools/setup.ps1 -Php "C:\\xampp\\php\\php.exe"`

## Test rapidi

- Hub endpoint read-only:
    - `https://<host>/LpWF_refactor/hub_catalogo/index.php?path=articoli`
    - Filtri: `q`, `categoria`, `tenant`, `tipologia`, `visibilita`
- API applicative (autenticate): `/api/*` (usa login per ottenere token)
    - Ticketing (nuovo):
        - `GET /api/tickets[?mine=1]` elenco (se non ADMIN, visibili: creati da o assegnati all'utente)
        - `POST /api/tickets` body: `{ titolo, descrizione?, priorita? }` (creatore=utente corrente)
        - `GET /api/tickets/{id}` dettagli
        - `PUT /api/tickets/{id}` aggiorna campi ammessi (`titolo`, `descrizione`, `priorita`, `categoria`, `cliente_id`, `assegnato_a`)
        - `PUT /api/tickets/{id}/assign` assegna (admin può assegnare a chiunque; utente può auto‑assegnarsi)
        - `PUT /api/tickets/{id}/close` chiude (assegnatario o admin)
        - `PUT /api/tickets/{id}/reopen` riapre (solo admin/supervisor)
        - `GET /api/tickets/{id}/comment` lista commenti
        - `POST /api/tickets/{id}/comment` body: `{ messaggio }` aggiunge commento (utente corrente)
        - `POST /api/tickets/{id}/comment_attach` multipart form: `comment_id`, `file`
        - `GET /api/tickets/{id}/attachments` lista allegati (per commento), campi: `commento_id`, `nome_file_originale`, `percorso_file`
        - Filtri supportati: `stato`, `priorita`, `assegnato_a`, `creato_da`, `cliente_id`, `search`, `mine=1`, `team=1` (per ADMIN/SUPERVISOR: ticket del team) e `chiuso_dal=YYYY-MM-DD HH:MM:SS` (conteggio chiusi nel periodo)
- Pagina test servizi (autenticata): `services_test.html`
    - Richiede login da `login.html` per salvare base API e token.
    - Endpoint usati: `/api/services/{whatsapp|email|order|document|payment|ticket|chat}`
    - Configurazione (facoltativa) in `.env` per provider reali:
        - `SERVICES_VERIFY_SSL=1`
        - WhatsApp: `WHATSAPP_PROVIDER=twilio|meta` + credenziali Twilio/Meta
            - Meta Cloud API: `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID`
            - Per avviare conversazioni (fuori finestra 24h) usa un Template approvato:
              `META_WHATSAPP_TEMPLATE_NAME` e `META_WHATSAPP_TEMPLATE_LANG` (predef. `it`).
              Il testo inviato sarà passato come primo parametro del body del template.
        - Email: `EMAIL_PROVIDER=smtp|mailgun|sendgrid|mailup` + chiavi se non `smtp`
            - MailUp (bridge): imposta `MAILUP_WEBHOOK_URL` (endpoint tuo che fa da ponte verso MailUp)
            - MailUp (OAuth diretto):
              - Obbligatori: `MAILUP_CLIENT_ID`, `MAILUP_CLIENT_SECRET`, `MAILUP_TOKEN_URL` (default OK), `MAILUP_SEND_URL`.
              - Grant type (scegli uno):
                - `MAILUP_GRANT_TYPE=password` + `MAILUP_USERNAME`, `MAILUP_PASSWORD`
                - `MAILUP_GRANT_TYPE=client_credentials` (+ opzionale `MAILUP_SCOPE`)
              - Mittenti: `MAILUP_FROM`, `MAILUP_FROM_NAME`, `MAILUP_REPLY_TO`.
              - Nota: `MAILUP_SEND_URL` varia in base al prodotto MailUp (Console API vs Send/Transactional). Adegua al tuo endpoint.
        - Stripe: `STRIPE_API_KEY`, `PAYMENT_CURRENCY=EUR`
        - Webhook opzionali: `ORDER_WEBHOOK_URL`, `DOCUMENT_WEBHOOK_URL`, `PAYMENT_WEBHOOK_URL`, `TICKET_WEBHOOK_URL`, `CHAT_WEBHOOK_URL`
        - Forward automatico ticket in creazione: `TICKET_FORWARD_ON_CREATE=1` (opzionale; richiede `TICKET_WEBHOOK_URL`)
    - Retry falliti: `/api/services/retry_failed` (POST) o CLI `php tools/services_retry.php --limit=20 --since=24`
        - Suggerito cron: ogni 5-10 minuti per riprovare errori transitori.

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

- Linux/macOS: `bash tools/deploy_manual.sh`
    - Opzioni:
        - `-b, --branch <name>`: branch da deployare (default auto: `main` se esiste, altrimenti `staging`).
        - `--no-db`: non esegue gli script di setup DB.
        - `--php </path/to/php>`: specifica il binario PHP (default: `/opt/plesk/php/8.3/bin/php` o `php`).
    - Esempi:
        - `bash tools/deploy_manual.sh`
        - `bash tools/deploy_manual.sh --branch main`
        - `bash tools/deploy_manual.sh -b staging --no-db`

- Windows (PowerShell): `./tools/deploy_manual.ps1`
    - Parametri:
        - `-Branch <name>`: branch da deployare (default auto: `main`/`staging`).
        - `-NoDb`: non esegue gli script di setup DB.
        - `-Php <path>`: percorso di `php.exe` (se non nel PATH). Prova automaticamente: `php`, `C:\xampp\php\php.exe`, `C:\Program Files\php\php.exe`, `C:\php\php.exe`.
    - Esempi (PowerShell):
        - `./tools/deploy_manual.ps1`
        - `./tools/deploy_manual.ps1 -Branch main`
        - `./tools/deploy_manual.ps1 -Branch staging -NoDb`

Requisiti

- `.env` presente nella root del progetto con credenziali DB (vedi `.env.example`).
- L'utente del server deve avere accesso al repo Git remoto (origin) per `fetch/pull`.

Suggerimento Windows

- Se preferisci ambienti Unix‑like su Windows, puoi usare WSL (Windows Subsystem for Linux) e rieseguire i comandi Bash invariati (`wsl --install`, poi Ubuntu → `bash tools/deploy_manual.sh`).

Bootstrap Windows (one‑liner)

- PowerShell: `./tools/dev_bootstrap.ps1 -RunSetup`
    - Esegue: Composer install (o composer.phar locale), npm install/ci, crea `.vscode` consigliato, e lancia il setup DB.
