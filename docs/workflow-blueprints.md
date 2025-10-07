# Blueprint workflow – Processi tipo

In questo documento vengono descritti alcuni workflow predefiniti (“blueprint”) che i tenant possono duplicare e personalizzare. Ogni blueprint specifica i passi principali, le azioni standard coinvolte, i dati scambiati e le possibili varianti.

## 1. Noleggio veicolo con servizi ausiliari

### Obiettivo

Gestire l’intero ciclo di un noleggio auto, includendo proposte di servizi complementari (auto sostitutiva, valet, assicurazione extra), generazione documenti e solleciti di pagamento.

### Sequenza passi

1. **Richiesta cliente**
    - Azione: `CREA_ORDINE` (raccolta dati cliente, periodo, veicolo richiesto).
    - Output: ordine in stato `DA_CONFERMARE`.

2. **Verifica disponibilità**
    - Azione: `VERIFICA_SCORTE_SERVIZIO`
    - Controlla slot disponibili via API hub (`/catalogo/varianti/{id}/disponibilita`).
    - Se non disponibili, workflow dirama verso step “Proposta alternativa”.

3. **Proposta servizi ausiliari**
    - Azione: `SUGGERISCI_RELATI`
    - Legge relazioni `SERVIZIO_AUSILIARIO` dal catalogo.
    - Se il cliente accetta, aggiunge voci al carrello/ordine.

4. **Conferma ordine**
    - Azione: `CONFERMA_ORDINE`
    - Aggiorna stato a `CONFERMATO`, blocca disponibilità slot.

5. **Emissione contratto/fattura**
    - Azione: `GENERA_DOCUMENTO` (tipo `CONTRATTO`/`FATTURA PROFORMA`).
    - Popola `documenti` e crea scadenze (es. acconto/subentro).

6. **Incasso acconto**
    - Azione: `RICHIEDI_PAGAMENTO_DIGITALE`
    - Genera link gateway (Stripe/Nexi) e attende esito (webhook → completa task).

7. **Check-out veicolo**
    - Azione: `REGISTRA_CONSEGNA`
    - Checklist: condizioni veicolo, chilometraggio, carburante.

8. **Fine noleggio / Check-in**
    - Azione: `REGISTRA_RICONSEGNA`
    - Calcola extra (Km eccedenti, danni), aggiorna scorte.

9. **Emetti fattura finale**
    - Azione: `GENERA_DOCUMENTO` (tipo `FATTURA`), con saldo cauzione/extra.

10. **Incasso saldo e chiusura**
    - Azione: `REGISTRA_PAGAMENTO`
    - Aggiorna scadenze, chiude ordine.

### Varianti

- Branch “Proposta alternativa” se disponibilità insufficiente.
- Notifica automatica al cliente + task manuale nel caso il pagamento non arrivi entro X giorni.

### Azioni standard coinvolte

`CREA_ORDINE`, `VERIFICA_SCORTE_SERVIZIO`, `SUGGERISCI_RELATI`, `CONFERMA_ORDINE`, `GENERA_DOCUMENTO`, `RICHIEDI_PAGAMENTO_DIGITALE`, `REGISTRA_CONSEGNA`, `REGISTRA_RICONSEGNA`, `REGISTRA_PAGAMENTO`.

---

## 2. Vendita prodotto con consegna e fatturazione

### Obiettivo

Gestire il ciclo di vendita di un bene fisico: dall’ordine alla consegna, passando per logistica, fatturazione e incasso.

### Passi principali

1. **Acquisizione ordine** (`CREA_ORDINE`)
2. **Controllo stock** (`VERIFICA_SCORTE_MAGAZZINO`)
    - Se stock insufficiente: branch verso “Genera ordine a fornitore”.
3. **Pagamento anticipato/manuale** (`RICHIEDI_PAGAMENTO` o `VERIFICA_PAGAMENTO`)
4. **Preparazione spedizione** (`PREPARA_SPEDIZIONE`)
    - Genera etichetta, prenota corriere (integrazione esterna).
5. **Aggiorna scorta** (`AGGIORNA_SCORTE`)
6. **Emissione DDT/Fattura** (`GENERA_DOCUMENTO` con tipo `DDT`, poi `FATTURA`)
7. **Consegna confermata** (`REGISTRA_CONSEGNA_CORRIERE`)
8. **Incasso saldo** (`REGISTRA_PAGAMENTO`)
9. **Post-vendita** (`APRI_TICKET_ASSISTENZA` opzionale)

### Varianti e branch

- Beni su commessa: step aggiuntivo “Produzione”/“Acquisto fornitore”.
- Pagamento posticipato: generazione piano scadenze con step di reminder.

### Notifiche

- Invio email/SMS automatici in step chiave (ordine ricevuto, spedito, consegnato).

---

## 3. Gestione ticket/assistenza

### Obiettivo

Gestire richieste di assistenza clienti con possibilità di escalation e collegamento a ordini/contratti.

### Passi tipo

1. **Ticket aperto** (`CREA_TICKET`) – raccoglie descrizione, priorità, cliente.
2. **Classificazione** (`CLASSIFICA_TICKET`) – assegna categoria, SLA.
3. **Assegnazione tecnica** (`ASSEGNA_TICKET`) – seleziona tecnico/gruppo.
4. **Diagnosi** (`AGGIUNGI_NOTA`) – registrazione interventi eseguiti.
5. **Richiesta parti/servizi** (branch) – `CREA_ORDINE_INTERNO` se serve materiale.
6. **Risoluzione** (`CHIUDI_TICKET`) – aggiorna stato `RISOLTO`.
7. **Verifica soddisfazione** (`INVIA_SURVEY`) – invia questionario al cliente.

### Escalation

- Se timer SLA scade → notifica responsabile + passo “Escalation” con assegnazione a livello superiore.

---

## 4. Recupero crediti / gestione scadenze

### Obiettivo

Automatizzare il monitoraggio delle scadenze e la gestione delle azioni di recupero su clienti insolventi.

### Passi

1. **Identifica scadenze prossime** (`ESTRAI_SCADENZE`)
2. **Invio promemoria** (`INVIA_SOLLECITO_EMAIL`)
3. **Follow-up telefonico** (`CREA_TASK_CHIAMATA`)
4. **Escalation legale** (`APRI_PRACTICE_LEGALE`) – se oltre N giorni.
5. **Registrazione pagamento** (`REGISTRA_PAGAMENTO`) – chiude scadenza.
6. **Aggiornamento piano rate** (`AGGIORNA_SCADENZE`) – se accordo rateale.

### Integrazione con pagamenti

- Utilizza API `GET /scadenze` per individuare rate aperte.
- Può generare `RICHIEDI_PAGAMENTO_DIGITALE` per link diretto al cliente.

---

## 5. Onboarding nuovo fornitore/partner

### Obiettivo

Gestire l'inserimento di un nuovo fornitore nel marketplace, includendo raccolta documenti, approvazioni interne e pubblicazione catalogo iniziale.

### Passi

1. **Richiesta onboarding** (`CREA_TICKET`) – registrazione dati preliminari.
2. **Verifica documentale** (`VERIFICA_DOCUMENTI`) – controlla visura, certificazioni, ecc.
3. **Approvals interne** (`RICHIEDI_APPROVAZIONE`) – responsabile acquisti, compliance.
4. **Creazione account tenant** (`CREA_TENANT_HUB`) – invia chiamata all’hub per generare tenant_id, credenziali API.
5. **Import catalogo iniziale** (`IMPORTA_CATALOGO`) – carica file CSV/Excel e crea eventi `ARTICOLO_CREATE`.
6. **Formazione completata** (`PROGRAMMA_TRAINING`) – step con checklist.
7. **Go-live** (`PUBBLICA_TENANT`) – abilita visibilità marketplace.

## Azioni standard da predisporre

- **Catalogo & marketplace**
    - `SUGGERISCI_RELATI`, `VERIFICA_SCORTE_MAGAZZINO`, `VERIFICA_SCORTE_SERVIZIO`, `AGGIORNA_SCORTE`, `IMPORTA_CATALOGO`.
- **Documenti & pagamenti**
    - `GENERA_DOCUMENTO`, `RICHIEDI_PAGAMENTO`, `RICHIEDI_PAGAMENTO_DIGITALE`, `REGISTRA_PAGAMENTO`, `AGGIORNA_SCADENZE`.
- **Workflow generici**
    - `CREA_TICKET`, `CLASSIFICA_TICKET`, `ASSEGNA_TICKET`, `INVIA_SOLLECITO_EMAIL`, `APRI_PRACTICE_LEGALE`, `RICHIEDI_APPROVAZIONE`.
- **Integrazione hub**
    - `CREA_TENANT_HUB`, `PUBBLICA_TENANT`, `SYNC_PUSH` (forza invio eventi pendenti).

## Linee guida per personalizzazione

- Ogni blueprint va duplicato dal tenant e adattato (campi custom, filtri, ruoli destinatari).
- Prevedere checklist preconfigurate per step manuali (es. `REGISTRA_CONSEGNA` con checklist danni veicolo).
- Ogni azione standard deve gestire esiti success/fail (`next_step_success`, `next_step_fail`).
- Utilizzare variabili di contesto (es. `{{cliente.email}}`, `{{ordine.id}}`) per email/notifiche.
