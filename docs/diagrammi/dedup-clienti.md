# Dedup Clienti (Hub ↔ Tenant)

Questo diagramma esemplifica la logica di deduplicazione “hard” (P.IVA/CF) e “soft” (email/telefono) quando un Tenant crea un nuovo cliente.

```mermaid
flowchart TB
  subgraph Input
    A1[ragione_sociale]
    A2[partita_iva?]
    A3[codice_fiscale?]
    A4[email?]
    A5[telefono?]
  end

  A1 --> DEDUP
  A2 --> DEDUP
  A3 --> DEDUP
  A4 --> DEDUP
  A5 --> DEDUP

  subgraph DEDUP [Logica dedup]
    direction TB
    H1{P.IVA/CF presenti?}
    H2[Lookup Hub: piva/cf]
    H3{Trovato?}
    S1{HUB_CLIENTI_SOFT_DEDUP=1\n& email/tel presenti?}
    S2[Lookup Hub: email/telefono\n(match esatto)]
    S3{Unico candidato?}
  end

  H1 -- sì --> H2 --> H3
  H1 -- no --> S1
  H3 -- sì --> PFILL
  H3 -- no --> S1
  S1 -- sì --> S2 --> S3
  S1 -- no --> CREATE_LOCAL
  S3 -- sì --> PFILL
  S3 -- no --> CREATE_LOCAL

  PFILL[Precompila dati mancanti\n(Set hub_cliente_id)] --> MAP
  CREATE_LOCAL[Crea cliente locale\n(senza link se non trovato)] --> OUT
  MAP[Registra mappatura su Hub\n(clienti_tenant_map)] --> OUT
  OUT[201 Created]

  classDef hub fill:#eef,stroke:#66f,color:#000;
  classDef local fill:#efe,stroke:#6c6,color:#000;
  class H2,S2,MAP hub;
  class PFILL,CREATE_LOCAL local;
```

Note
- “Hard match”: P.IVA/CF hanno priorità e determinano l’unicità.
- “Soft match”: attivabile con `HUB_CLIENTI_SOFT_DEDUP=1` e usa match esatto su email/telefono solo se il candidato è unico.
- In caso di ambiguità su soft match non si effettua il link automatico.

