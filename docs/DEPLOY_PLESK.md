# Deploy con Plesk (staging + produzione)

## Prerequisiti

- Estensione Plesk "Git" installata
- Repo remota (GitHub/GitLab/Bitbucket)

## Staging

1. Crea branch `staging` nel repo.
2. In Plesk, Apri "Git" -> Add Repository
    - Mode: Remote Git hosting
    - Repository URL: <repo>
    - Branch: `staging`
    - Deployment path: `/httpdocs/LpWF_refactor` (o una sottocartella staging)
3. Abilita "Automatic deployment on push".
4. (Opzionale) Configura una seconda istanza per `main` (produzione) puntando alla cartella prod.

## Variabili ambiente

- Usa `.env` sul server (non committato). Aggiorna `.env.example` nel repo per i nuovi parametri.

## Migrazioni

- Dopo il deploy, esegui:
    - `php tools/setup_hub_db.php`
    - `php tools/setup_tenant_db.php`

---

## Deploy con GitHub Actions (SSH)

In alternativa all'estensione Git di Plesk, puoi fare deploy automatico via GitHub Actions con rsync/SSH.

### Dati necessari

- Host/porta/utente SSH (es. `95.110.227.54`, `22`, `root`)
- Path di deploy:
    - Staging: `/var/www/vhosts/lprent.it/httpdocs/LpWf_staging`
    - Produzione: `/var/www/vhosts/lprent.it/httpdocs/LpWF_refactor`
- PHP CLI: `/opt/plesk/php/8.3/bin/php`

### Step 1 — Genera chiave SSH (locally)

```bash
ssh-keygen -t ed25519 -C "deploy@LpWf" -f ~/.ssh/lpwf_deploy
cat ~/.ssh/lpwf_deploy.pub
```

Copia la chiave pubblica sul server (utente scelto, es. root):

```bash
ssh-copy-id -i ~/.ssh/lpwf_deploy.pub -p 22 root@95.110.227.54
# Oppure manualmente: append a ~/.ssh/authorized_keys
```

### Step 2 — Imposta i GitHub Secrets del repo

Repository Settings → Secrets → Actions → New repository secret

- `SSH_HOST_STAGING` = `95.110.227.54`
- `SSH_HOST_PROD` = `95.110.227.54`
- `SSH_PORT` = `22`
- `SSH_USER` = utente di sistema della subscription Plesk che possiede il path di deploy (es. `admin_prova`). Usa `root` solo se necessario e abilitato via SSH.
- `SSH_KEY` = contenuto di `~/.ssh/lpwf_deploy` (chiave privata ED25519)
- (in alternativa) `SSH_KEY_B64` = la stessa chiave privata ma codificata in base64 (comodo per evitare problemi di newline)
- `DEPLOY_PATH_STAGING` = `/var/www/vhosts/lprent.it/httpdocs/LpWf_staging`
- `DEPLOY_PATH_PROD` = `/var/www/vhosts/lprent.it/httpdocs/LpWF_refactor`
- `PHP_BIN` = `/opt/plesk/php/8.3/bin/php`
- (Opzionale ma consigliato) `SSH_KNOWN_HOSTS` = output di `ssh-keyscan -p 22 95.110.227.54`

Per ottenere la host key:

```bash
ssh-keyscan -p 22 95.110.227.54 > known_hosts
cat known_hosts
```

Incolla il contenuto nel secret `SSH_KNOWN_HOSTS`. Così evitiamo `StrictHostKeyChecking=no`.

Se preferisci usare `SSH_KEY_B64` (base64)

```bash
# Linux/macOS
base64 -w 0 ~/.ssh/lpwf_deploy > lpwf_key.b64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.ssh\lpwf_deploy"))
```

Incolla il risultato nel secret `SSH_KEY_B64`. Il workflow decodificherà la chiave e la caricherà nell'agent.

### Step 3 — Workflow

Il file `.github/workflows/deploy.yml` è già in repo e:

- Al push su `staging` deploya su `DEPLOY_PATH_STAGING`.
- Al push su `main` deploya su `DEPLOY_PATH_PROD`.
- Esegue post-deploy:
    - `${PHP_BIN} tools/setup_hub_db.php`
    - `${PHP_BIN} tools/setup_tenant_db.php`
- Valida la presenza dei secrets richiesti e fallisce subito se mancanti (incluso `SSH_KEY` o `SSH_KEY_B64`).
- Se `SSH_KNOWN_HOSTS` non è impostato, il workflow effettua automaticamente `ssh-keyscan` sull'host/porta target per popolare `known_hosts` (con formattazione `[host]:port` se la porta ≠ 22) e applica `StrictHostKeyChecking=yes`. Se lo scan fallisce, ricade su `StrictHostKeyChecking=accept-new`.

### Plesk Git — Additional Deploy Actions (consigliato)

Se usi l'estensione Plesk Git per il deploy automatico, imposta nelle "Additional deploy actions" il comando:

```
bash tools/post_deploy.sh
```

Il file `tools/post_deploy.sh` esegue gli script PHP di setup DB usando `/opt/plesk/php/8.3/bin/php` se presente, altrimenti `php` nel PATH. Non richiede variabili segrete.

### Nota — Utente SSH e chiavi

- `SSH_USER` deve corrispondere all'utente di sistema Plesk proprietario di `${DEPLOY_PATH_*}` (Plesk → Subscription → Web Hosting Access). Se usi `root`, assicurati che l'accesso SSH con chiave sia consentito e che la chiave sia installata in `~root/.ssh/authorized_keys`.
- Installa la CHIAVE PUBBLICA corrispondente al secret `SSH_KEY`/`SSH_KEY_B64` in `~$SSH_USER/.ssh/authorized_keys` (oppure da Plesk → SSH Keys). Permessi consigliati: `chmod 700 ~/.ssh` e `chmod 600 ~/.ssh/authorized_keys` (proprietario: `$SSH_USER`).
- Il workflow forza l'uso della chiave caricata (`ssh -i $HOME/.ssh/deploy_key -o IdentitiesOnly=yes`); verifica che la chiave pubblica installata corrisponda esattamente alla privata nel secret.
- Per ottenere la chiave pubblica dalla privata (locale): `ssh-keygen -y -f ~/.ssh/lpwf_deploy > lpwf_deploy.pub` e poi appendi il contenuto a `authorized_keys` dell'utente target.

Puoi anche lanciare manualmente il deploy da GitHub → Actions → Deploy → Run workflow scegliendo `staging` o `production`.

### Step 4 — Protezione branch / status checks

- Imposta branch protection per `main` e `staging` e abilita:
    - Require a pull request before merging
    - Require status checks to pass (seleziona i job della CI)
    - (Opzionale) Limita chi può fare merge

Assicurati che il file `.env` esista sul server (non committato) con le credenziali corrette; gli script di setup lo leggono.
