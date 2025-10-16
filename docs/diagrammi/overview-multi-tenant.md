# Panoramica multi-tenant LPWF

La piattaforma LPWF eroga servizi ai propri clienti (Tenant). Ogni Tenant è isolato e gestisce a sua volta i propri clienti finali e le proprie risorse applicative.

- LPWF: autenticazione, API, servizi comuni, Hub Catalogo centrale (read-only, retrocompatibile)
- Tenant: utenti, clienti, workflow/task, ticket/commenti/allegati, catalogo locale, listini/prezzi
- Isolamento: dati e permessi scopiati per tenant; il tenant può consultare/importare dal Hub

```mermaid
flowchart TB
  LPWF[LPWF — Piattaforma] --> T1[Tenant 1]
  LPWF --> Tn[Tenant N]

  subgraph S1 [Tenant]
    direction TB
    U[Utenti]
    C[Clienti]
    W[Workflow / Task]
    TK[Ticket / Commenti / Allegati]
    CAT[Catalogo Tenant]
    L[Listini / Prezzi]
    DB[(DB per-tenant)]
  end

  Hub[Hub Catalogo\n(read-only, retrocompatibile)] -. consulta/importa .-> CAT

  subgraph HUB [Hub — Dati centralizzati]
    direction TB
    HART[Articoli]
    HCLI[Clienti]
    MAP[Mappe tenant]
  end

  HCLI -. dedup/pre-fill .-> C

  class HUB hub;

  classDef hub fill:#eef,stroke:#66f,color:#000;
  classDef tenant fill:#efe,stroke:#6c6,color:#000;
  class Hub hub;
  class S1 tenant;
```

Relazioni sintetiche (scopiatura per tenant):

```mermaid
erDiagram
  TENANTS ||--o{ UTENTI : "possiede"
  TENANTS ||--o{ CLIENTI : "serve"
  TENANTS ||--o{ WORKFLOW_ISTANZE : "esegue"
  WORKFLOW_ISTANZE ||--o{ WORKFLOW_TASK : "compone"
  TENANTS ||--o{ TICKETS : "gestisce"
  TICKETS ||--o{ TICKET_COMMENTI : "ha"
  TICKET_COMMENTI ||--o{ TICKET_ALLEGATI : "allega"
  TENANTS ||--o{ LISTINI : "definisce"
  LISTINI ||--o{ PREZZI_ARTICOLI : "prezza"
```

Note:
- L'Hub Catalogo è centrale e rimane read-only; i tenant mappano/ingestono nel proprio dominio (retrocompatibilità garantita).
- Le API includono sempre il contesto del tenant (autenticazione e scoping dei dati).

## Flusso creazione cliente con dedup su Hub

```mermaid
sequenceDiagram
  autonumber
  participant UI as UI Tenant
  participant API as /api/clienti (Tenant)
  participant HUB as Hub DB (clienti)
  participant MAP as Hub DB (clienti_tenant_map)

  UI->>API: POST clienti { ragione_sociale, partita_iva? / cf? }
  alt P.IVA/CF presenti
    API->>HUB: SELECT clienti WHERE partita_iva=... OR codice_fiscale=...
    alt Trovato su Hub
      HUB-->>API: Anagrafica cliente
      API->>API: Precompila campi mancanti
    else Non trovato
      API->>HUB: INSERT clienti (...)
      HUB-->>API: id (hub_cliente_id)
    end
    API->>API: Inserisce cliente locale con hub_cliente_id
    API->>MAP: INSERT clienti_tenant_map (cliente_id, tenant_id, cliente_id_tenant)
  else P.IVA/CF assenti
    API->>API: Inserisce cliente locale (senza link Hub)
  end
  API-->>UI: 201 { id, ... }
```

– Un Tenant può anche essere Cliente (es. per fatturazione tra aziende): in Hub il cliente può avere `tenant_assoc_id` per collegare l’anagrafica al record del tenant.

Vedi anche: `docs/diagrammi/dedup-clienti.md` per la versione in flowchart (hard vs soft match).
