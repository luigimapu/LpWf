cd ..# Schema dati tenant – Workflow, documenti e pagamenti

Questo schema descrive la componente dati presente in ciascun database di tenant. Gestisce workflow personalizzati, anagrafiche, documenti contabili, scadenze e pagamenti (entrata/uscita), oltre al tracciamento delle sincronizzazioni verso l’hub centrale.

## Sezione anagrafiche principali

### `utenti`
- `id` (PK)
- `nome`, `cognome`
- `email`
- `password_hash`
- `ruolo` (es. `ADMIN`, `OPERATORE`, `CONTABILITA`)
- `stato` (`ATTIVO`, `DISABILITATO`)
- `creato_il`, `aggiornato_il`, `ultimo_accesso`

### `clienti`
- `id` (PK)
- `ragione_sociale`
- `partita_iva` / `codice_fiscale`
- `indirizzo`, `cap`, `citta`, `provincia`, `nazione`
- `email`, `telefono`
- `tipo_cliente` (`AZIENDA`, `PRIVATO`, `PA`)
- `note`
- `creato_il`, `aggiornato_il`

### `fornitori`
Stessa struttura di `clienti` (si può valutare tabella unica `anagrafiche` con flag).

### `conti_finanziari`
Rappresenta casse, conti correnti, carte.
- `id` (PK)
- `nome`
- `tipologia` (`CASSA`, `BANCA`, `CARTA`, `GATEWAY_DIGITALE`)
- `valuta`
- `saldo_iniziale`
- `iban` / `bic` / `dettagli_gateway`
- `creato_il`, `aggiornato_il`

## Workflow e azioni

### `workflow_modelli`
- `id` (PK)
- `nome`
- `descrizione`
- `attivo`
- `creato_da` (FK → utenti)
- `creato_il`, `aggiornato_il`

### `workflow_passi`
- `id` (PK)
- `workflow_modello_id`
- `nome_passo`
- `descrizione`
- `ordine`
- `sottopasso`
- `tipo_azione_standard` (FK → `azioni_standard`)
- `parametri_azione` (JSON)
- `responsabile_utente_id` / `responsabile_gruppo_id`

### `workflow_istanze`
- `id` (PK)
- `workflow_modello_id`
- `entita_collegata_tipo` / `entita_collegata_id` (es. ordine, contratto)
- `stato` (`IN_CORSO`, `COMPLETATO`, `ANNULLATO`, `SOSPESO`)
- `avviato_da` (FK → utenti)
- `avviato_il`, `completato_il`

### `workflow_task`
- `id` (PK)
- `workflow_istanza_id`
- `workflow_passo_id`
- `nome`
- `descrizione`
- `stato` (`APERTO`, `IN_LAVORAZIONE`, `COMPLETATO`, `ANNULLATO`)
- `assegnato_a_utente_id`
- `assegnato_il`
- `completato_il`
- `note`

### `azioni_standard`
Catalogo di azioni riutilizzabili nei workflow.
- `id` (PK)
- `codice`
- `nome`
- `descrizione`
- `parametri_richiesti` (JSON)
- `script_handler` / `classe_handler`
- `creato_il`

## Documenti contabili

### `documenti`
- `id` (PK)
- `tipo_documento` (`FATTURA`, `NOTA_CREDITO`, `DDT`, `ORDINE`, …)
- `numero`
- `serie`
- `data_emissione`
- `cliente_id` / `fornitore_id`
- `stato` (`BOZZA`, `EMESSO`, `INVIATO`, `ANNULLATO`)
- `totale_imponibile`
- `totale_imposta`
- `totale_documento`
- `valuta`
- `note`
- `creato_il`, `aggiornato_il`

### `documenti_righe`
- `id` (PK)
- `documento_id`
- `articolo_id` (FK verso catalogo locale oppure riferimento hub)
- `descrizione`
- `quantita`
- `unita_misura`
- `prezzo_unitario`
- `sconto_percentuale`
- `aliquota_iva`
- `totale_riga`

### `documenti_aliquote`
- `id` (PK)
- `documento_id`
- `aliquota`
- `base_imponibile`
- `imposta`

### `documenti_allegati`
- `id` (PK)
- `documento_id`
- `nome_file`
- `path`
- `tipo_allegato`
- `creato_il`

## Scadenze e pagamenti

### `scadenze`
- `id` (PK)
- `documento_id`
- `numero_rata`
- `data_scadenza`
- `importo`
- `stato` (`DA_PAGARE`, `PAGATA`, `INSOLUTA`, `RIMANDATA`)
- `note`

### `pagamenti`
- `id` (PK)
- `direzione` (`ENTRATA`, `USCITA`)
- `cliente_id` / `fornitore_id`
- `conti_finanziari_id`
- `metodo_pagamento_id`
- `importo`
- `valuta`
- `data_pagamento`
- `stato` (`PREVISTO`, `REGISTRATO`, `IN_ATTESA`, `ANNULLATO`)
- `riferimento_esterno` (es. id transazione gateway)
- `note`
- `creato_il`, `aggiornato_il`

### `pagamenti_documenti`
- `pagamento_id`
- `documento_id`
- `scadenza_id` (opzionale)
- `importo_allocato`

### `metodi_pagamento`
- `id` (PK)
- `nome`
- `tipologia` (`BONIFICO`, `CARTA`, `RID`, `CONTANTI`, `GATEWAY_DIGITALE`, …)
- `parametri` (JSON, credenziali, IBAN, ecc.)
- `attivo`

### `transazioni_gateway`
- `id` (PK)
- `pagamento_id`
- `gateway`
- `stato`
- `richiesta_payload`
- `risposta_payload`
- `creato_il`
- `aggiornato_il`

### `prima_nota`
- `id` (PK)
- `conti_finanziari_id`
- `data`
- `descrizione`
- `importo`
- `tipo_movimento` (`ENTRATA`, `USCITA`, `GIROCONTO`)
- `riferimento_documento_id`
- `creato_il`

## Integrazione con l’hub centrale

### `sync_uscita`
- `id` (PK)
- `entita` (`ARTICOLO`, `SCORTA`, `PREZZO`, `DOCUMENTO`, …)
- `entita_id`
- `tipo_evento` (`CREA`, `AGGIORNA`, `ELIMINA`)
- `payload` (JSON)
- `stato` (`IN_ATTESA`, `INVIATO`, `ERRORE`)
- `tentativi`
- `ultimo_tentativo_il`
- `errore`

### `log_sync`
- `id` (PK)
- `entita`
- `entita_id`
- `direzione` (`VERSO_HUB`, `DA_HUB`)
- `stato`
- `messaggio`
- `creato_il`

## Reportistica locale

Per velocizzare le dashboard interne è utile mantenere viste/materializzate o tabelle di supporto:
- `report_vendite` (aggregazioni per periodo, cliente, articolo).
- `report_scadenze` (aging, importi per fascia).
- `report_workflow` (tempi medi, passaggi più lenti).

## Note implementative
- Introdurre `deleted_il` per le tabelle chiave (soft delete).
- Utilizzare trigger o job per aggiornare `scadenze` quando un documento viene emesso con piano di pagamento.
- Ogni pagamento in entrata/uscita deve aggiornare automaticamente la prima nota e lo stato delle scadenze collegate.
- Le azioni standard del workflow devono poter creare eventi in `sync_uscita` (es. pubblicare articolo, aggiornare scorte, inviare stato ordine al marketplace).
- Pianificare notifiche automatiche per scadenze imminenti/insolute (workflow o job schedulati).

## Collegamenti con altri documenti
- Consultare `docs/schema-hub-catalogo.md` per la controparte centrale (catalogo condiviso).
- Il documento `docs/progetto-gestionale.md` contiene la visione complessiva e la roadmap.

## Passi successivi
- Modellare ER diagram tenant + hub (strumento UML/diagrammi).
- Definire i contratti di sincronizzazione (payload JSON, regole di merge, error handling).
- Pianificare gli adapter di pagamento e le relative azioni di workflow.
