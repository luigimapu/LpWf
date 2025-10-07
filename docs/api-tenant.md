# API tenant – Servizi interni ed esposizione esterna

Questa sezione documenta le API interne/esterne che ciascun tenant mette a disposizione. Gli obiettivi principali sono:

- offrire al frontend gestionale tutte le funzionalità (workflow, documenti, pagamenti);
- permettere a integrazioni di terze parti di interagire con il gestionale del tenant (es. partner logistici, fornitori);
- ricevere chiamate dal marketplace/hub (es. ordini cross-tenant).

## Convenzioni

- Base URL tipica: `https://<tenant>.example.com/api/v1`.
- Autenticazione: JWT con ruoli/permessi (utente interno, service account, integrazione esterna).
- Formato: JSON UTF-8.
- Tutti gli endpoint rispondono con wrapper standard:

```json
{
  "success": true,
  "data": {...},
  "errors": []
}
```

## 1. Anagrafiche e utenti

### 1.1 Utenti interni

- `GET /utenti`
- `POST /utenti`
- `PUT /utenti/{id}`
- `PATCH /utenti/{id}/reset-password`
- Permessi: ruolo `ADMIN`.

### 1.2 Clienti e fornitori

- `GET /anagrafiche?tipo=CLIENTE|FORNITORE`
- `POST /clienti`
- `POST /fornitori`
- `PUT /clienti/{id}`
- `DELETE /clienti/{id}` (soft delete con `deleted_il`).

## 2. Workflow

### 2.1 Modelli

- `GET /workflow/modelli`
- `POST /workflow/modelli`
- `PUT /workflow/modelli/{id}`
- `POST /workflow/modelli/{id}/duplica`
- Permette di definire passi, azioni standard, responsabili.

### 2.2 Istanze e task

- `POST /workflow/istanze`
- `GET /workflow/istanze/{id}`
- `GET /workflow/task?stato=APERTO&assegnato_a=...`
- `POST /workflow/task/{id}/completa`
- `POST /workflow/task/{id}/note`

### 2.3 Azioni standard

- `GET /workflow/azioni-standard`
- `POST /workflow/azioni-standard` (solo admin tecnici).

## 3. Catalogo locale

- Il tenant mantiene un proprio catalogo per gestione operativa; questi endpoint permettono di coordinare il catalogo interno con quello centrale (possono essere usati dal frontend o dal processo di sincronizzazione).

### 3.1 Articoli

- `GET /catalogo/articoli`
- `POST /catalogo/articoli`
- `PUT /catalogo/articoli/{id}`
- `DELETE /catalogo/articoli/{id}`
- Include campi `id_centrale` per linking.

### 3.2 Scorte e prezzi

- `POST /catalogo/varianti/{id}/scorta`
- `POST /catalogo/varianti/{id}/prezzo`
- I job di sincronizzazione leggono queste tabelle e inviano eventi all’hub.

## 4. Documenti, pagamenti, contabilità

### 4.1 Documenti

- `GET /documenti?tipo=FATTURA&stato=EMESSO`
- `POST /documenti`
- `PUT /documenti/{id}` (aggiorna dati non fiscali finché in bozza)
- `POST /documenti/{id}/emetti`
- `POST /documenti/{id}/annulla`
- `GET /documenti/{id}/pdf` (generate o restituisce PDF archiviato).

### 4.2 Pagamenti

- `GET /pagamenti?direzione=ENTRATA&stato=PREVISTO`
- `POST /pagamenti`
- `POST /pagamenti/{id}/registra`
- `POST /pagamenti/{id}/annulla`
- `POST /pagamenti/{id}/genera-link` (per pagamenti digitali, ritorna URL gateway).

### 4.3 Scadenze e reminder

- `GET /scadenze?stato=DA_PAGARE&entro=2024-03-31`
- `POST /scadenze/{id}/posticipa`
- `POST /scadenze/{id}/chiudi`
- Endpoint utilizzati dai job/azioni workflow per automatizzare solleciti.

### 4.4 Prima nota e conti

- `GET /conti`
- `POST /conti`
- `POST /prime-note`
- `GET /prime-note?dal=...&al=...`
- Supportano dashboard di tesoreria.

## 5. Integrazione marketplace

### 5.1 Ordini marketplace

- `POST /marketplace/ordini`
    - chiamato dall’hub quando un altro tenant effettua un ordine.
    - Corpo: dati ordine + id articoli centrali.
    - Risposta: `201` con `id_locale` ordine.
- `POST /marketplace/ordini/{id}/stato`
    - aggiornamento stato (es. `CONFERMATO`, `IN_LAVORAZIONE`, `EVASO`).

### 5.2 Sincronizzazione manuale

- `POST /sync/push` → forza invio eventi ancora pending.
- `GET /sync/stato` → riporta conteggi eventi `IN_ATTESA`, `ERRORE`, ultimo tentativo.

## 6. Autenticazione e permessi

- Gestione JWT: endpoint `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Permessi granulari:
    - `CATALOGO_MODIFICA`, `WORKFLOW_MODIFICA`, `CONTABILITA_VIEW`, `PAGAMENTI_REGISTRA`, ecc.
- Possibilità di API key dedicate per integrazioni (limitazione IP, ruoli specifici).

## 7. Notifiche e webhook

- `POST /webhook/configura` per registrare un webhook (es. per CRM esterno) sugli eventi `documento_emesso`, `pagamento_registrato`, `task_completato`.
- `GET /webhook/log` per consultare esiti.

## 8. Monitoring

- `GET /health` → stato del servizio.
- `GET /metrics` (esportato in formato Prometheus) per tempo risposta medio, errori, eventi sync pendenti.

## 9. Sicurezza

- Rate limiting per token/utente.
- Audit log: ogni endpoint registra utente, orario, payload essenziale.
- Crittografia dei dati sensibili in transito (TLS) e a riposo secondo policy del tenant.
