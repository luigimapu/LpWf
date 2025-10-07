# API hub centrale – Catalogo e sincronizzazione

Questo documento descrive l’API REST esposta dall’hub centrale. Fornisce gli endpoint per:

- sincronizzare catalogo, scorte e prezzi inviati dai tenant;
- consultare il catalogo centralizzato e i suggerimenti;
- recuperare lo stato della sincronizzazione e feed marketplace.

## Convenzioni generali

- Base URL (esempio): `https://hub.example.com/api/v1`.
- Autenticazione: header `Authorization: Bearer <token>` generato dal servizio di identity dell’hub.
- Formato: JSON UTF-8.
- Risposte errore: status appropriato + corpo `{"errore": {"codice": "...", "messaggio": "..."}}`.
- Versionamento: header `X-API-Version` opzionale per retro-compatibilità.

## 1. Endpoint sincronizzazione (push)

### 1.1 Creazione/Aggiornamento articolo

- `POST /sync/articoli`
- Corpo: payload descritto in `docs/sincronizzazione-tenant-hub.md` (`ARTICOLO_CREATE/UPDATE`).
- Risposte:
    - `201 Created` con `esito: OK` in caso di nuovo articolo.
    - `200 OK` per aggiornamento.
    - Errori: `400`, `401`, `409`, `422`, `500`.

### 1.2 Eliminazione articolo

- `POST /sync/articoli/elimina`

```json
{
    "tenant_id": "TENANT123",
    "evento": "ARTICOLO_DELETE",
    "payload": {
        "id_centrale": "ART-98231"
    }
}
```

- Risposte: `200 OK` (impostato `stato_pubblicazione = ARCHIVIATO`), `404` se non trovato.

### 1.3 Gestione varianti

- `POST /sync/varianti`
- Corpo: multiplo (create/update/delete). Ogni variante include `azione` (`CREATE`, `UPDATE`, `DELETE`).

### 1.4 Relazioni e bundle

- `POST /sync/relazioni`
- `POST /sync/bundle`
- Permette di sovrascrivere l’elenco completo (strategia “replace all”) oppure aggiornare incrementale (`modalita`: `REPLACE`, `MERGE`).

### 1.5 Scorte

- `POST /sync/scorte`
- Corpo: lista scorte per variante con timestamp.
- Comportamento: l’hub registra la scorta per il tenant proprietario; se `magazzino` assente, utilizza deposito predefinito.

### 1.6 Prezzi/Listini

- `POST /sync/prezzi`
- Accetta definizione di un listino e relativo set prezzi.
- Parametri query: `?modalita=replace|append` per decidere se cancellare il listino precedente.

### 1.7 Slot disponibilità

- `POST /sync/disponibilita`
- Permette di inviare slot orari o disponibilità giornaliere.

### 1.8 Documenti (facoltativo)

- `POST /sync/documenti`
- Consente di archiviare metadati fatture/DDT a fini statistici.

### Header comuni

```
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <uuid opzionale>
```

## 2. Endpoint consultazione catalogo

### 2.1 Ricerca articoli

- `GET /catalogo/articoli`
- Query param principali:
    - `q`: stringa full-text
    - `categoria`: slug categoria
    - `tipologia`: `FISICO|SERVIZIO|DIGITALE|BUNDLE`
    - `tenant`: filtro per proprietario
    - `pagina`, `limite`
- Risposta: lista articoli con varianti principali, disponibilità sintetica, prezzi min/max.

### 2.2 Dettaglio articolo

- `GET /catalogo/articoli/{id}`
- Include: varianti, attributi, bundle componenti, relazioni, media.

### 2.3 Suggerimenti/Relazioni

- `GET /catalogo/articoli/{id}/relazioni?tipo=UPSELL`
- Restituisce la lista di articoli correlati con priorità e motivazione.

### 2.4 Disponibilità

- `GET /catalogo/varianti/{id}/disponibilita?dal=...&al=...`
- Restituisce slot disponibili.

### 2.5 Listini

- `GET /catalogo/listini/{codice}`
- Permette a un tenant di verificare il listino applicato (solo per il proprietario o utenti con permessi).

## 3. Endpoint amministrativi/sincronizzazione

### 3.1 Stato sincronizzazione

- `GET /sync/stato/articoli?tenant=TENANT123`
- Risposta: elenco articoli con `id_locale`, `id_centrale`, `versione_sync`, ultimo esito, eventuali avvisi.

### 3.2 Feed marketplace

- `GET /sync/feed/marketplace?categoria=...`
- Ritorna novità pubblicate da altri tenant (solo dati pubblici, senza info sensibili).

### 3.3 Download log

- `GET /sync/eventi?tenant=...&dal=...&al=...`
- Permette di scaricare il registro eventi elaborati dall’hub.

## 4. Autenticazione e sicurezza

- Ogni tenant ottiene un token (OAuth2 client_credentials o API key). Il token codifica l’`id_tenant` e i permessi (es. scrittura catalogo, lettura marketplace).
- Rate limiting per IP/tenant (es. 100 richieste/min). In caso di superamento: `429 Too Many Requests` con indicazione `Retry-After`.
- Tutte le operazioni sono registrate con ID univoco (header `X-Request-ID`).

## 5. Versionamento e compatibilità

- Aggiornamenti breaking sono annunciati con versioni (`/api/v2`).
- Endpoint `GET /meta/versione` restituisce la versione corrente e changelog sintetico.

## 6. Webhook (future extension)

- Possibilità di configurare webhook a cui l’hub invia eventi importanti (es. ordine marketplace, aggiornamento disponibilità) per ridurre polling.
- Formato webhook conforme al payload di sincronizzazione.
