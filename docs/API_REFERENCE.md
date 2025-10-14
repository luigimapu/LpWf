# API Reference – LpWF Gestionale

Base comune: tutte le rotte espongono prefisso `.../api`.

- Autenticazione: header `Authorization: Bearer <token>` (salvo `health`, `tenant_health` e `hub_catalogo/*`).
- Content-Type: `application/json` per body JSON.

Indice

- Autenticazione
- Diagnostica & Config
- Ticket (assistenza)
- Task & Workflow
- Utenti & Gruppi
- Clienti
- Audit & Service Logs
- Servizi di integrazione (WhatsApp, Email, Order, Document, Payment, Ticket, Chat)
- Catalogo (tenant → hub)

## Autenticazione

POST `/api/auth/login`

Request

```json
{ "email": "utente@example.com", "password": "..." }
```

Response 200

```json
{
  "access_token": "<JWT>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": { "id": 1, "email": "utente@example.com", "nome": "...", "cognome": "...", "ruolo": "USER" }
}
```

GET `/api/auth/me`

Response 200: utente corrente (senza `password_hash`).

POST `/api/auth/logout`

POST `/api/auth/password`

```json
{ "current_password": "...", "new_password": "..." }
```

POST `/api/auth/password-reset`

```json
{ "user_id": 123, "new_password": "..." }
```

Esempio cURL

```bash
curl -sX POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"utente@example.com","password":"pwd"}'
```

## Diagnostica & Config

- GET `/api/health` (pubblica)
- GET `/api/tenant_health` (pubblica)
- GET `/api/config`

## Ticket (assistenza)

Lista: GET `/api/tickets`

Query opzionali: `stato`, `priorita`, `assegnato_a`, `creato_da`, `cliente_id`, `search`, `mine=1`, `team=1` (ADMIN/SUPERVISOR), `chiuso_dal=YYYY-MM-DD HH:MM:SS`.

Dettaglio: GET `/api/tickets/{id}`

Crea: POST `/api/tickets`

```json
{ "titolo": "PC non si accende", "descrizione": "Schermo nero", "priorita": "ALTA" }
```

Aggiorna: PUT `/api/tickets/{id}` (user non admin può modificare solo `descrizione`, `priorita`, `categoria` se creatore/assegnatario)

Azioni:

- PUT `/api/tickets/{id}/assign` `{ "user_id": 5 }` (opzionale; se assente → auto‑assegna)
- PUT `/api/tickets/{id}/close`
- PUT `/api/tickets/{id}/reopen`
- GET `/api/tickets/{id}/comment`
- POST `/api/tickets/{id}/comment` `{ "messaggio": "In lavorazione" }`
- POST `/api/tickets/{id}/comment_attach` multipart `comment_id`, `file` (max configurato: `MAX_TICKET_ATTACHMENT_MB`)
- GET `/api/tickets/{id}/attachments`

Esempi cURL

```bash
curl -s "$API/tickets?mine=1" -H "Authorization: Bearer $TOKEN"
curl -sX POST "$API/tickets" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"titolo":"Problema rete","priorita":"MEDIA"}'
curl -sX PUT "$API/tickets/10/assign" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" -d '{}'
```

## Task & Workflow

Task

- GET `/api/tasks` filtri: `workflow_istanza_id|id_istanza_workflow`, `workflow_modello_id|workflow_id|id_workflow`, `assegnato_a_utente_id|id_utente_assegnato`, `unassigned=true`, `stato`, `id_stato`, `search`
- PUT `/api/tasks/{id}/assign` `{ "user_id": 5 }` (opzionale)
- PUT `/api/tasks/{id}/complete`
- GET `/api/tasks/{id}/note`
- POST `/api/tasks/{id}/note` `{ "id_utente":1, "nota":"..." }`
- POST `/api/tasks/{id}/note_attach` (multipart `note_id`, `file`)

Workflow

- GET `/api/workflows` | `/api/workflows/{id}` (con passi)
- POST `/api/workflows/{id}/start` Body opz: `{ "entita_collegata_tipo":"...", "entita_collegata_id":"..." }`
- GET `/api/workflowistanze` | `/api/workflowistanze/{id}`

## Utenti & Gruppi

Utenti: GET `/api/utenti` (+ filtri `search`, `ruolo`, `group_id`, `include_inactive`, `with_groups`, `with_supervisors`), CRUD `/api/utenti/{id}`.

Supervisor mapping

- GET `/api/utenti/{id}/supervised`
- POST `/api/utenti/{id}/add_supervised/{userId}`
- DELETE `/api/utenti/{id}/remove_supervised/{userId}`
- GET `/api/utenti/{id}/supervisors`
- POST `/api/utenti/{id}/set_supervisor/{supervisorId}`

Gruppi: CRUD `/api/gruppi` (+ `with_user_counts=true`)

## Clienti

- GET `/api/clienti` (CRUD standard)
- POST `/api/clienti` effettua dedup su hub e precompilazione dati:
  - Se nel body è presente `partita_iva` o `codice_fiscale`, l'API verifica su hub (DB `hub_catalogo`) l'esistenza del cliente.
  - Se trovato, precompila i campi mancanti e collega il record locale con `hub_cliente_id`.
  - Se non esiste, crea l'anagrafica centrale su hub e salva l'ID in `hub_cliente_id`.
  - Se configurato `TENANT_ID`, viene registrata la mappatura su hub (`clienti_tenant_map`).
  - Opzione dedup "soft" (email/telefono): se `HUB_CLIENTI_SOFT_DEDUP=1` e P.IVA/CF non sono presenti o non matchano, l'API prova un match esatto su `email` e/o `telefono`. Solo se c'è un unico candidato su hub, viene effettuato il link; in caso di ambiguità non viene agganciato automaticamente.
- Colonne `latitudine`/`longitudine` e `hub_cliente_id` sono gestite da migrazione idempotente (`tools/setup_tenant_db.php`).

Response 201 (POST /api/clienti)

```json
{ "message": "Record creato con successo.", "id": 123, "link_hub": true, "hub_cliente_id": 456 }
```

## Audit & Service Logs

- GET `/api/audit_roles?limit=N`
- GET `/api/auth_audit?limit=N`
- GET `/api/service_logs?limit=N`

## Servizi integrazione

Base: POST `/api/services/{whatsapp|email|order|document|payment|ticket|chat}`

Esempi

```bash
curl -sX POST "$API/services/whatsapp" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"to":"+391234..","message":"Ciao"}'
curl -sX POST "$API/services/email" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"to":"utente@example.com","subject":"Hi","body":"Test"}'
```

Status provider: GET `/api/services/status`

Retry: POST `/api/services/retry` `{ "id": 123 }`, POST `/api/services/retry_failed` `{ "limit":20, "since_hours":24 }`

## Catalogo (tenant → hub)

Scrittura autenticata:

- `/api/catalogo_articoli`, `/api/catalogo_varianti`, `/api/catalogo_prezzi`, `/api/catalogo_articoli_categorie`, `/api/catalogo_relazioni`, `/api/catalogo_listini`, `/api/catalogo_categorie`

Media (articoli): `/api/catalog_media`

Lettura (read‑only, senza auth): `.../hub_catalogo/index.php?path=<risorsa>`

Esempi

```
hub_catalogo/index.php?path=articoli&q=term&categoria=...&tenant=...&tipologia=...&visibilita=...
hub_catalogo/index.php?path=categorie
```

## Tenants (Hub)

- GET `/api/hub_tenants` (lista, autenticato)
- GET `/api/hub_tenants/{id}` (dettaglio con `stato`)
- POST `/api/hub_tenants` (solo Admin): `{ ragione_sociale, slug, stato? }`
- PUT `/api/hub_tenants/{id}` (solo Admin): `{ ragione_sociale?, slug?, stato? }`

Note
- L'endpoint `hub_catalogo` rimane read‑only; la gestione in scrittura avviene tramite `/api/hub_tenants`.
- Lo slug deve essere univoco (a‑z, 0‑9, `._-`).

---

Suggerimenti

- Imposta `.env` con JWT e DB per l’ambiente locale.
- Test rapidi UI: `login.html` per token, `services_test.html` per integrazioni, `api_test.html` (nuovo) per provare le rotte.
