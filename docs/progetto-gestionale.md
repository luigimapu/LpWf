# Progetto Gestionale Centralizzato

## Visione Generale

- Offrire a ogni cliente/tenant un gestionale completo e personalizzabile che includa workflow dinamici, fatturazione e pagamenti.
- Mantenere un **hub centrale** condiviso per cataloghi prodotti/servizi, disponibilità e prezzi, consentendo la vendita incrociata tra tenant.
- Supportare beni fisici, servizi, asset digitali e bundle complessi con suggerimenti automatici di articoli correlati.

## Architettura Multi-tenant

- **Tenant DB**: ogni cliente mantiene il proprio database applicativo (workflow, documenti fiscali, pagamenti, utenti interni).
- **Hub Centrale**: database condiviso con catalogo sincronizzato, ricerca, analytics e funzioni marketplace.
- **Sincronizzazione**: processi/eventi da tenant a centrale (create/update/delete) con log di esito e risoluzione conflitti.

## Catalogo & Marketplace

- Tabelle centrali: `items`, `item_variants`, `attribute_sets`, `stocks`, `price_lists`, `bundles`, `item_relations`, `categories`, `media_assets`.
- Supporto a:
    - Attributi dinamici per tipologia di articolo (fisico/servizio/digitale).
    - Relazioni upsell/cross-sell/add-on per suggerimenti.
    - Disponibilità e listini multi-tenant con versioning.
- API di pubblicazione/ricerca e indicizzazione per il marketplace.

## Workflow Personalizzabili

- Estendere `azioni_standard` con step predefiniti (es. generazione documenti, richiesta pagamento, promemoria scadenze).
- Blueprint di workflow per scenari ricorrenti (noleggio, servizi, vendita pacchetti) che sfruttano suggerimenti dal catalogo.

## Fatturazione & Pagamenti

- Modello tenant-side: `documents`, `document_lines`, `document_taxes`, `document_payments`, `payment_methods`, `payment_plans`, `payments`, `payment_transactions`, `due_dates`.
- Gestione di:
    - Documenti fiscali (fatture, DDT, note credito) con numerazioni configurabili.
    - Pagamenti totali/parziali, rateizzazioni e calendario scadenze.
    - Integrazione con gateway digitali tramite adapter (Stripe/PayPal/Nexi/… ).
    - Pagamenti in entrata e uscita con controllo approvazioni e riconciliazione.
- Sincronizzazione verso l’hub per riepiloghi marketplace (es. commissioni, KPI globali).

## Reportistica

- Tenant: flusso di cassa, aging scadenze, KPI workflow, analytics vendite.
- Centrale: statistica marketplace, ranking fornitori, volumi cross-tenant, commissioni.
- Implementazione prevista con ETL/Event streaming da tenant a un data mart centrale (tabelle `reporting_*`).

## Sicurezza & Governace

- Ruoli/permessi distinti per operatori tenant e staff centrale.
- Tracciamento audit per operazioni finanziarie e aggiornamenti catalogo.
- Policy di validazione al momento della sincronizzazione (categorie valide, attributi richiesti, prezzi min/max).

## Roadmap Operativa

1. **Definizione Schema Dati**
    - ER diagram hub centrale (catalogo, bundle, relazioni).
    - ER diagram tenant (documenti, pagamenti, workflow).
2. **Servizi & API**
    - Servizio “Catalog Hub” con endpoint pubblicazione/ricerca.
    - Modulo billing/payment tenant con integrazione gateway.
3. **Motore Workflow**
    - Nuove azioni standard (documenti, pagamenti, notifiche) e blueprint.
4. **Sincronizzazione & Conflitti**
    - Event log su tenant, consumer centrale, gestione versioni.
5. **Reportistica**
    - Definizione dataset, pipeline ETL, dashboard (tenant + hub).
6. **Sicurezza & Compliance**
    - Ruoli, policy, audit log e gestione errori.
7. **PoC & Iterazioni**
    - PoC sincronizzazione item/stock.
    - PoC fatturazione + pagamento digitale con workflow.
    - Integrazione completa marketplace ↔ workflow ↔ billing.

## Prossimi Passi

- Validare e dettagliare lo schema dati (tenant + hub) a partire da questo documento.
- Vedi `docs/schema-hub-catalogo.md` per il dettaglio del dominio catalogo/marketplace.
- Vedi `docs/schema-tenant-gestionale.md` per la struttura dati interna a ciascun tenant.
- Diagrammi ER disponibili in `docs/diagrammi/er-hub-catalogo.md` e `docs/diagrammi/er-tenant-gestionale.md` (notazione Mermaid).
- Diagrammi UML (PlantUML) in `docs/diagrammi/uml-hub-catalogo.puml` e `docs/diagrammi/uml-tenant-gestionale.puml` (renderizzabili con PlantUML/Graphviz).
- Le regole di sincronizzazione sono descritte in `docs/sincronizzazione-tenant-hub.md`.
- Definizione API hub: `docs/api-hub.md`; API tenant: `docs/api-tenant.md`.
- Blueprint workflow disponibili in `docs/workflow-blueprints.md`.
- Schedulazione dei job di push/processing in `docs/schedulazione-job.md`.
- Identificare priorità di sviluppo e timeline (MVP catalogo vs billing vs reportistica).
- Stendere specifiche API e contratti di sincronizzazione per allineare team frontend/backend.
