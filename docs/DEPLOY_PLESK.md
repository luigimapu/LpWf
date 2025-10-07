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

