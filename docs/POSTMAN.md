# Postman – Guida rapida

Questa guida spiega come importare la collection e gli ambienti, ottenere il token e testare le API.

## 1) Import

- Collection: `docs/postman_collection.json`
- Ambienti:
  - Local: `docs/postman_environment.json` (`baseUrl = http://localhost/api`)
  - Staging: `docs/postman_environment.staging.json`
  - Production: `docs/postman_environment.prod.json`

Suggerimenti

- Da browser: usa i link “Apri in Postman” / “Import Web” presenti in `docs/swagger.html` o `docs/api.html`.
- In alternativa: Import → Link e incolla l’URL assoluto del file (es. `https://<host>/LpWF_refactor/docs/postman_collection.json`).

## 2) Seleziona ambiente e baseUrl

- Scegli l’ambiente (Local/Staging/Production) in alto a destra in Postman.
- Se necessario, modifica `baseUrl` nell’ambiente selezionato (es. `http://localhost/api`).

## 3) Login e token

- Esegui la richiesta “Auth → Login” con credenziali valide.
- Copia `access_token` dalla risposta e incollalo nella variabile di ambiente `token`.
- Tutte le richieste che lo richiedono aggiungono `Authorization: Bearer {{token}}` automaticamente.

Note

- I token scadono (vedi `JWT_EXP_SECONDS`); ripeti il login se ottieni `401`.
- Alcuni endpoint sono pubblici (`/health`, `/tenant_health`, `hub_catalogo`).

## 4) Upload di file (allegati)

- Esempi nella collection:
  - Ticket → “Comment / Attach”: `POST /tickets/{id}/comment_attach` con `form-data` (`comment_id`, `file`).
  - Tasks → “Notes / Attach”: `POST /tasks/{id}/note_attach` con `form-data` (`note_id`, `file`).
- Seleziona un file locale nel campo `file`. Limiti configurabili in `.env` (`MAX_TICKET_ATTACHMENT_MB`, `MAX_NOTE_ATTACHMENT_MB`).

## 5) Servizi esterni

- Cartella “Services”: WhatsApp, Email, Payment, …
- Configura i provider/WEBHOOK in `.env` (es. `WHATSAPP_PROVIDER`, `EMAIL_PROVIDER`, `STRIPE_API_KEY`, `*_WEBHOOK_URL`).
- Stato configurazione: `GET /services/status`.

## 6) Catalogo (Hub)

- Esempi per articoli, varianti, prezzi, categorie, relazioni e listini nella cartella “Catalog (Hub)”.
- Nota: endpoint di sola lettura pubblici su `hub_catalogo/index.php?path=articoli`.

## Troubleshooting

- `401 Unauthorized`: token scaduto o mancante → rifai Login e aggiorna `{{token}}`.
- `405 Method Not Allowed`: controlla il metodo/azione supportata (vedi OpenAPI o testo dell’errore).
- `413 / File troppo grande`: riduci la dimensione o aumenta `MAX_*_ATTACHMENT_MB` in `.env` (server).
- `Permessi upload`: verifica cartella `uploads/` scrivibile e `tenant_health`/`health` per diagnostica.

## Extra: Test script (opzionale)

Se vuoi salvare il token in automatico dopo il Login, aggiungi nei “Tests” della richiesta Login:

```js
const data = pm.response.json();
if (data && data.access_token) {
  pm.environment.set('token', data.access_token);
}
```

Così non devi copiare/incollare manualmente il token dopo ogni login.

