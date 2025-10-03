# Sincronizzazione tenant ↔ hub centrale

Questo documento definisce i formati di messaggio, i flussi e le regole per mantenere allineati i dati tra i database dei tenant e l'hub centrale. L'obiettivo è garantire coerenza del catalogo, delle disponibilità e dei prezzi, riducendo al minimo i conflitti e fornendo tracing completo delle operazioni.

## Principi
- **Push dal tenant**: ogni evento nasce dal gestionale del tenant, che accoda l'operazione nella tabella `sync_uscita` e la invia all'hub tramite API REST.
- **Ack dall'hub**: l'hub risponde sempre con un esito (`OK`, `WARN`, `ERROR`) che il tenant registra in `log_sync`, gestendo i retry in caso di errore temporaneo.
- **Versionamento**: ogni entità sincronizzata espone un timestamp ISO o un intero `versione_sync` usato per evitare overwrite da payload obsoleti.
- **Audit e id correlati**: il tenant mantiene l'`id_centrale` restituito dall'hub per riferimenti futuri; tutti gli eventi includono `tenant_id` + `id_locale`.
- **Canale sicuro**: autenticazione con API key o JWT per ogni tenant, TLS obbligatorio.
- **Provisioning credenziali**: l'API key (`HUB_API_KEY`) viene generata dal servizio hub (o dal suo portale amministrativo) e consegnata al tenant. In fase di sviluppo si può utilizzare un valore placeholder, da sostituire con la chiave reale al momento dell'onboarding.

## Eventi supportati (MVP)
| Codice evento            | Descrizione                              |
|-------------------------|------------------------------------------|
| `ARTICOLO_CREATE/UPDATE`| Pubblicazione o modifica articolo        |
| `ARTICOLO_DELETE`       | Ritiro articolo                          |
| `VARIANTE_CREATE/UPDATE`| Gestione varianti dello stesso articolo  |
| `VARIANTE_DELETE`       | Rimozione variante                       |
| `RELAZIONE_SET`         | Aggiornamento relazioni/suggerimenti     |
| `BUNDLE_SET`            | Definizione componenti bundle            |
| `SCORTA_UPDATE`         | Aggiornamento livelli di stock           |
| `PREZZO_SET`            | Pubblicazione prezzi/listini             |
| `DISPONIBILITA_SET`     | Slot prenotabili per servizi             |
| `DOCUMENTO_EMESSO`*     | Metadati documenti fiscali (opzionale)   |


## Struttura messaggio

```json
{
  "tenant_id": "TENANT123",
  "evento": "ARTICOLO_UPDATE",
  "versione": "2024-03-01T10:15:30Z",
  "payload": { ... }
}
```

- `tenant_id`: codice assegnato all'azienda nell'hub.
- `evento`: codice dalla tabella precedente.
- `versione`: timestamp ISO8601 o integer monotono.
- `payload`: contenuto specifico per evento.

L'hub restituisce sempre:

```json
{
  "esito": "OK",
  "messaggi": [
    {"tipo": "WARN", "codice": "CAT_IGNORE", "dettaglio": "Categoria NON_STANDARD sostituita con GENERICA."}
  ],
  "dati": {
    "id_centrale": "ART-98231",
    "versione_salvata": "2024-03-01T10:15:31Z"
  }
}
```

- `esito`: `OK`, `WARN`, `ERROR`.
- `messaggi`: lista avvisi/errori.
- `dati`: informazioni utili (id centrali, versione applicata).

### Errori tipici
- `400 BAD_REQUEST`: formato non valido.
- `401 UNAUTHORIZED`: credenziali errate.
- `409 CONFLICT`: versione più vecchia di quella salvata.
- `422 UNPROCESSABLE_ENTITY`: violazioni regole (attributo mancante, categoria inesistente).
- `500 INTERNAL_ERROR`: problemi temporanei; il tenant deve riprovare dopo backoff.

## Payload dettagliati

### Articolo create/update

**Endpoint**: `POST /sync/articoli`

```json
{
  "tenant_id": "TENANT123",
  "evento": "ARTICOLO_UPDATE",
  "versione": "2024-03-01T10:15:30Z",
  "payload": {
    "articolo": {
      "id_locale": "ART567",
      "id_centrale": "ART-98231",
      "sku_globale": "TENANT123-00042",
      "titolo": "Servizio di noleggio auto",
      "sottotitolo": "Auto berlina 5 posti",
      "descrizione": "Descrizione completa",
      "tipologia": "SERVIZIO",
      "stato_pubblicazione": "PUBBLICATO",
      "visibilita": "MARKETPLACE",
      "set_attributi": "SERVIZI_NOLEGGIO",
      "attributi": {
        "categoria_vehicle": "BERLINA",
        "conducente_incluso": false
      }
    },
    "categorie": ["AUTOMOTIVE", "NOLEGGIO"],
    "varianti": [
      {
        "id_locale": "VAR1",
        "id_centrale": "VAR-550",
        "sku": "TENANT123-00042-A",
        "nome": "Noleggio 1 giorno",
        "attributi": {
          "durata_ore": 24,
          "chilometri_inclusi": 150
        }
      }
    ],
    "relazioni": [
      {
        "tipo": "SERVIZIO_AUSILIARIO",
        "articolo_correlato_sku": "TENANT123-00077",
        "priorita": 10
      }
    ],
    "bundle": null
  }
}
```

- `id_centrale` è opzionale in create; obbligatorio in update.
- Se `bundle` non è `null`, contiene componenti (`articolo_component_id`, `quantita`, `opzionale`).

### Varianti

```json
{
  "evento": "VARIANTE_UPDATE",
  "payload": {
    "id_articolo_centrale": "ART-98231",
    "varianti": [
      {
        "id_locale": "VAR2",
        "id_centrale": null,
        "sku": "TENANT123-00042-B",
        "nome": "Noleggio 3 giorni",
        "attributi": {"durata_ore": 72}
      }
    ]
  }
}
```

### Relazioni / bundle

```json
{
  "evento": "RELAZIONE_SET",
  "payload": {
    "id_articolo_centrale": "ART-98231",
    "relazioni": [
      {"tipo": "UPSELL", "articolo_correlato": "ART-444", "priorita": 5},
      {"tipo": "SERVIZIO_AUSILIARIO", "articolo_correlato": "ART-450"}
    ]
  }
}
```

### Scorte

```json
{
  "evento": "SCORTA_UPDATE",
  "versione": "2024-03-02T08:00:00Z",
  "payload": {
    "id_variante_centrale": "VAR-550",
    "magazzino": "WH-01",
    "quantita_totale": 10,
    "quantita_riservata": 2
  }
}
```

### Prezzi / listini

```json
{
  "evento": "PREZZO_SET",
  "payload": {
    "listino": {
      "codice": "DEFAULT",
      "valuta": "EUR",
      "valido_dal": "2024-03-01"
    },
    "prezzi": [
      {
        "id_variante_centrale": "VAR-550",
        "prezzo": 65.0,
        "prezzo_confronto": 80.0,
        "quantita_minima": 1,
        "quantita_massima": 5,
        "condizioni": {
          "cauzione": 200.0
        }
      }
    ]
  }
}
```

### Slot di disponibilità (servizi)

```json
{
  "evento": "DISPONIBILITA_SET",
  "payload": {
    "id_variante_centrale": "VAR-550",
    "slot": [
      {
        "inizio": "2024-03-10T08:00:00Z",
        "fine": "2024-03-10T18:00:00Z",
        "capacita": 3
      }
    ]
  }
}
```

### Documenti (facoltativo)

```json
{
  "evento": "DOCUMENTO_EMESSO",
  "payload": {
    "id_locale": "FAT-2024-123",
    "tipo": "FATTURA",
    "data": "2024-03-01",
    "totale": 1200.50,
    "valuta": "EUR",
    "stato_pagamento": "PARZIALE",
    "importo_pagato": 600.0,
    "scadenze": [
      {"data": "2024-03-31", "importo": 600.0, "stato": "DA_PAGARE"}
    ]
  }
}
```

## Gestione conflitti
- L'hub confronta `versione` con la propria `versione_sync`: se il payload è più vecchio, risponde `409 CONFLICT` (il tenant deve recuperare la copia aggiornata dal hub e ripubblicare).
- In caso di conflitto logico (es. SKU duplicato su tenant diversi) l'hub restituisce `ERROR` con codice `SKU_DUPLICATO`; il tenant deve correggere e ripetere l'invio.
- Per scorte e prezzi, l'hub accetta sempre il dato più recente riferito al tenant proprietario (non esistono conflitti cross-tenant).

## Retry & backoff
- Il tenant riprova automaticamente eventi in stato `ERRORE` con backoff esponenziale (es. 1m, 5m, 15m, 1h) fino a un massimo configurabile.
- Dopo `n` tentativi falliti viene generato un task manuale per l'operatore.
- Gli errori definitivi (`422`) devono essere corretti prima di un nuovo invio.

## Pull dal tenant
- Endpoint `GET /sync/stato/articoli?tenant_id=...` per ottenere lo stato attuale degli articoli pubblicati (id centrale, versione, eventuali avvisi).
- Endpoint `GET /sync/feed/marketplace` per ricevere novità dagli altri tenant (solo elementi pubblici).

## Sicurezza
- Autenticazione tramite `Authorization: Bearer <JWT>` o `X-API-Key` dedicata al tenant.
- Rate limit per evitare flood accidentali.
- Logging dettagliato lato hub (tenant, IP, payload ridotto).

## Verifiche end-to-end
- `tools/demo_queue_article.php`: pubblicazione articolo di prova (SKU ART-REL-001/002).
- `tools/demo_queue_relazioni_bundle.php`: accodamento relazioni (`RELAZIONE_SET`) e bundle (`BUNDLE_SET`).
- `tools/sync_push.php 100`: invio eventi `ARTICOLO`, `RELAZIONE`, `BUNDLE` verso l'hub.
- `tools/hub_process_events.php 100`: processamento consumer con esiti `Articolo aggiornato`, `Relazioni aggiornate`, `Bundle aggiornato`.
- Query MySQL su `hub_catalogo`: verificate relazioni (`articoli_relazioni`) e bundle (`bundle`, `bundle_componenti`) per SKU ART-REL-001 ↔ ART-REL-002.

## Estensioni future
- Sincronizzazione bidirezionale delle valutazioni clienti/ordini (marketplace).
- Eventi workflow standardizzati (`ORDINE_STATO_CAMBIATO`, `PAGAMENTO_RICEVUTO`).
- Integrazione con sistemi ETL per replicare i dati su data warehouse esterni.
- Consumer hub: `services/HubEventProcessor.php` + `tools/hub_process_events.php` ora gestiscono articoli, varianti, scorte, prezzi, disponibilità, relazioni e bundle aggiornando lo stato `IN_ATTESA` → `ELABORATO`.
- Lato tenant, il servizio `services/SyncQueueService.php` offre helper per accodare articoli, varianti, scorte, prezzi, relazioni e bundle (vedi esempio `tools/demo_queue_article.php`).
