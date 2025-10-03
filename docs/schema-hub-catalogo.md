# Schema dati hub centrale – Catalogo e marketplace

Il presente documento descrive le entità e le relazioni del database centrale condiviso fra tutti i tenant. Lo scopo è raccogliere e normalizzare le informazioni di catalogo (prodotti, servizi, bundle), disponibilità, prezzi e correlazioni per alimentare il marketplace e i suggerimenti automatici.

## Panoramica
- Ogni tenant pubblica sul catalogo centrale gli articoli che desidera rendere visibili agli altri.
- Il catalogo deve gestire beni fisici, servizi, asset digitali e combinazioni (bundle) mantenendo attributi dinamici e relazioni tra articoli.
- Le quantità e i listini sono versionati per supportare aggiornamenti frequenti e risoluzione dei conflitti.
- Tutte le operazioni di sincronizzazione sono tracciate per auditing e monitoraggio.

## Entità principali

### Anagrafica tenant
`tenants`
- `id` (PK)
- `ragione_sociale`
- `slug` (identificativo URL)
- `stato` (`ATTIVO`, `SOSPESO`, `IN_ONBOARDING`)
- `creato_il`, `aggiornato_il`

### Articoli di catalogo
`articoli`
- `id` (PK)
- `tenant_id` (FK → tenants)
- `sku_globale` (unique)
- `tipologia` (`FISICO`, `SERVIZIO`, `DIGITALE`, `BUNDLE`, …)
- `titolo`, `sottotitolo`, `descrizione`
- `stato_pubblicazione` (`BOZZA`, `PUBBLICATO`, `ARCHIVIATO`)
- `visibilita` (`PRIVATO`, `MARKETPLACE`, `RISERVATO`)
- `set_attributi_id` (FK → set_attributi)
- `metadati` (JSONB)
- `pubblica_il`, `ritira_il`
- `creato_il`, `aggiornato_il`

### Varianti
`articoli_varianti`
- `id` (PK)
- `articolo_id` (FK → articoli)
- `sku`
- `nome`
- `attributi_override` (JSONB)
- `stato`
- `creato_il`, `aggiornato_il`

### Set di attributi
`set_attributi`
- `id` (PK)
- `nome`
- `descrizione`
- `tipologia_destinazione` (`FISICO`, `SERVIZIO`, …)

`attributi`
- `id` (PK)
- `set_attributi_id` (FK)
- `nome_tecnico`
- `etichetta`
- `tipo_dato` (`TESTO`, `NUMERO`, `BOOLEANO`, `SCELTA`, `JSON`)
- `obbligatorio` (boolean)
- `opzioni` (JSON, per valori enumerati)

`valori_attributi`
- `id` (PK)
- `articolo_id` (FK)
- `variante_id` (FK opzionale)
- `attributo_id` (FK)
- `valore_testo`
- `valore_numero`
- `valore_booleano`
- `valore_json`

### Tassonomie e categorie
`categorie`
- `id` (PK)
- `categoria_padre_id` (FK su categorie)
- `nome`
- `slug`
- `lft`, `rgt` (nested set) oppure `percorso`

`articoli_categorie`
- `articolo_id`
- `categoria_id`

### Bundle
`bundle`
- `id` (PK)
- `articolo_id` (FK, con tipologia = BUNDLE)
- `strategia_prezzo` (`FISSO`, `DINAMICO`, `SCONTO_PERCENTUALE`)
- `prezzo_bundle`
- `creato_il`, `aggiornato_il`

`bundle_componenti`
- `bundle_id` (FK)
- `articolo_component_id` (FK → articoli)
- `quantita`
- `opzionale` (boolean)
- `preselezionato` (boolean)

### Relazioni e suggerimenti
`articoli_relazioni`
- `id` (PK)
- `articolo_sorgente_id`
- `articolo_correlato_id`
- `tipo_relazione` (`UPSELL`, `CROSS_SELL`, `SERVIZIO_AUSILIARIO`, `SOSTITUTIVO`)
- `priorita`
- `creato_il`

### Disponibilità (scorte / agenda)
`scorte`
- `id` (PK)
- `variante_id`
- `tenant_id`
- `magazzino_id` (opzionale)
- `quantita_totale`
- `quantita_riservata`
- `quantita_disponibile`
- `aggiornato_il`
- `versione_sync`

`disponibilita_slot`
- `id` (PK)
- `variante_id`
- `inizio`
- `fine`
- `capacita_totale`
- `capacita_prenotata`

### Listini e prezzi
`listini`
- `id` (PK)
- `tenant_id`
- `nome`
- `valuta`
- `valido_dal`, `valido_al`
- `priorita`

`prezzi_articoli`
- `id` (PK)
- `listino_id`
- `variante_id`
- `prezzo`
- `prezzo_confronto`
- `quantita_minima`
- `quantita_massima`
- `condizioni_aggiuntive` (JSON)

### Contenuti multimediali
`risorse_multimediali`
- `id` (PK)
- `tenant_id`
- `articolo_id`
- `tipologia` (`IMMAGINE`, `DOCUMENTO`, `VIDEO`)
- `url`
- `testo_alternativo`
- `posizione`

### Sincronizzazione
`eventi_sync`
- `id` (PK)
- `tenant_id`
- `entita` (`ARTICOLO`, `SCORTA`, `PREZZO`, …)
- `entita_id`
- `tipo_evento` (`CREA`, `AGGIORNA`, `ELIMINA`)
- `payload` (JSON)
- `stato_elaborazione` (`IN_ATTESA`, `ELABORATO`, `ERRORE`)
- `elaborato_il`
- `errore`

## Relazioni principali
- Un tenant pubblica più articoli (`tenants` 1─* `articoli`).
- Un articolo può avere più varianti (`articoli` 1─* `articoli_varianti`).
- Ogni articolo eredita un set di attributi (`set_attributi` 1─* `attributi` → `valori_attributi`).
- Le categorie collegano articoli a tassonomie (`articoli` *─* `categorie`).
- I bundle sono articoli speciali con componenti (`bundle` 1─* `bundle_componenti`).
- Le relazioni collegano articoli per suggerimenti (`articoli_relazioni`).
- Le scorte e i listini fanno riferimento alle varianti (`articoli_varianti` 1─* `scorte` / `prezzi_articoli`).
- Gli eventi di sincronizzazione registrano ogni modifica ricevuta (`eventi_sync`).

## Note implementative
- Utilizzare `deleted_il` (soft delete) sulle tabelle principali per mantenere lo storico.
- Indici full-text su `titolo`, `descrizione`, attributi chiave per la ricerca, eventualmente replica verso motore dedicato (Elastic/Meilisearch).
- Versionamento di scorte e prezzi (`versione_sync`) per prevenire sovrascritture provenienti da upload obsoleti.
- Validazioni sul centrale: verifica attributi obbligatori, categorie ammesse, coerenza con tipologia articolo.
- Possibilità di generare relazioni automatiche (es. servizi ausiliari in base alla categoria) salvando comunque il risultato in `articoli_relazioni`.

## Prossimi passi
- Mappare campi e formati da inviare nella sincronizzazione tenant → hub.
- Definire gli endpoint API (REST/GraphQL) per pubblicazione, aggiornamento, ricerca e suggerimenti.
- Integrare gli eventi del workflow (es. completamento ordine) con aggiornamenti a scorte e disponibilità.
