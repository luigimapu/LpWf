# Feature backlog e integrazioni

Questo file raccoglie idee, richieste e integrazioni future in un formato semplice da mantenere in repository.

Legenda rapida

- Stato: INBOX · PLANNED · DOING · DONE · PARKED
- Priorità: P0 (bloccante), P1 (alta), P2 (media), P3 (bassa)
- Tipo: FEAT (feature), INT (integrazione), UX, PERF, DOCS, OPS

## Come proporre una nuova voce

Copia il template qui sotto nella sezione INBOX e compila i campi essenziali (titolo, descrizione, priorità). Quando triagiamo, la sposteremo nelle sezioni Now/Next/Later con owner e criteri di accettazione.

```
- [ID] Titolo sintetico
  - Stato: INBOX
  - Priorità: P1
  - Tipo: FEAT
  - Owner: —
  - Descrizione: …
  - Dipendenze: …
  - Criteri di accettazione:
    - [ ] …
    - [ ] …
```

---

## INBOX (da vagliare)

### Core gestionale

- [FG-001] Carico e scarico magazzino
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Gestione movimenti di magazzino (entrate/uscite), causali, valorizzazioni (FIFO/LIFO/medio), inventari e rettifiche.
    - Criteri di accettazione:
        - [ ] Movimenti con causale e riferimento documento
        - [ ] Giacenza per variante/lotto/ubicazione

- [FG-002] Catalogo Prodotti/Servizi e aggregazioni
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Catalogo unificato per prodotti e servizi; bundle/kit e set di servizi associati.
    - Criteri di accettazione:
        - [ ] Item “prodotto”, “servizio”, “bundle”
        - [ ] Prezzi e disponibilità per bundle

- [FG-003] Unire Prodotti e Servizi in offerta combinata
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Offerte che combinano prodotto principale e servizi accessori (installazione, trasporto, collaudo, ecc.).

- [FG-004] Pagamenti e incassi + Scadenziario
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Gestione partite attive/passive, scadenze, solleciti, quietanze, riconciliazione di base.

- [FG-005] Pagamenti splittati e parziali
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Rateizzazione/split payment su ordine/fattura, con calendario e metodi misti.

- [FG-006] Listini (vendita al dettaglio e digitale)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Listini multipli, regole sconto, canale (store fisico / digitale), valute.

- [FG-007] Fatturazione e adempimenti fiscali
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Fattura/nota credito/DDT, numerazioni, imposte, supporto black-box/RT dove richiesto.

- [FG-008] Vendita a lotti e all’asta
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Lotti, rilanci, prezzo di riserva, aggiudicazione, log eventi.

- [FG-009] Svendite e scontistiche
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Campagne prezzo, coupon, sconti volume/tempo, vendite lampo.

- [FG-010] Wizard comparazione acquisti/vendite
    - Stato: INBOX
    - Priorità: P3
    - Tipo: UX
    - Descrizione: Wizard che suggerisce migliore scelta in base al profilo target (es. follower/engagement del testimonial).

- [FG-011] Servizi a tempo (noleggio) con parametri
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Noleggi con overruns (ritardi), franchigie, carburante, penali, cauzioni.

### Commerciale

- [CM-001] Outreach inserzionisti/negozi digitali
    - Stato: INBOX
    - Priorità: P3
    - Tipo: OPS
    - Descrizione: Playbook e strumenti per contattare merchant su marketplace/piazzali annunci (eredità “Annunci Plus”).

### Integrazioni

- [INT-001] Registratore di cassa / RT
    - Stato: INBOX
    - Priorità: P1
    - Tipo: INT
    - Descrizione: Integrazione con RT/fiscal printer per scontrini/chiusure.

- [INT-002] Barcode e QRCode
    - Stato: INBOX
    - Priorità: P2
    - Tipo: INT
    - Descrizione: Stampa/lettura barcode/QR su etichette e documenti.

- [INT-003] SDI fatturazione elettronica
    - Stato: INBOX
    - Priorità: P0
    - Tipo: INT
    - Descrizione: Invio/ricezione FE-XML a SDI, notifiche e conservazione.

- [INT-004] Piattaforme di vendita (Amazon, Trovaprezzi, Subito, Ebay, Kijiji, Vinted, Shein, …)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: INT
    - Descrizione: Pubblicazione catalogo, sync stock/prezzi/ordini, mapping attributi per canale.

- [INT-005] Social marketplace (Facebook, Instagram, TikTok)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: INT
    - Descrizione: Shop/checkout social, pixel/conversion API, catalog sync.

- [INT-006] Pagamenti digitali (PayPal, carte, PagoDil, Klarna, dilazioni)
    - Stato: INBOX
    - Priorità: P1
    - Tipo: INT
    - Descrizione: Gateway multipli, split e piani di pagamento.

### Comunicazioni

- [COM-001] Canali Email/Social/Telefono/WhatsApp/Chat interna
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Omnicanale per notifiche, ticket, conversazioni operative.

### Import / Dump / Migrazioni

- [IMP-001] Schemi importazione da gestionali/piattaforme
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Template CSV/XLS/API, mapping campi, anteprima, validazioni, rollback.

### Particolarità e marketplace interno

- [MK-001] Pubblica ovunque: negozio fisico e digitale
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Un unico gestionale che alimenta store fisico e canali digitali.

- [MK-002] Rivendita cross-tenant (servizi/prodotti di altri tenant)
    - Stato: INBOX
    - Priorità: P1
    - Tipo: FEAT
    - Descrizione: Possibilità di comporre offerte usando servizi di altri tenant (installazione, trasporto, collaudo…).

- [MK-003] Recensioni e rating
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT
    - Descrizione: Rating/recensioni su prodotti/servizi/tenant.

- [MK-004] Criteri di acquisto (prezzo/tempi/servizi/rating/recensioni)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: UX

- [MK-005] Gestione social/follower
    - Stato: INBOX
    - Priorità: P3
    - Tipo: FEAT

- [MK-006] Eventi e scontistiche (Prime Day)
    - Stato: INBOX
    - Priorità: P3
    - Tipo: FEAT

- [MK-007] UI custom per tenant
    - Stato: INBOX
    - Priorità: P3
    - Tipo: UX

- [MK-008] Reminder omnicanale
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT

- [MK-009] Aste e vendite lampo (outlier pricing/obsolescenza)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT

- [MK-010] Analisi/consulenza sourcing cross-tenant
    - Stato: INBOX
    - Priorità: P3
    - Tipo: PERF

### Servizi integrati

- [SRV-001] Social Media Manager / Fotografo / Commercialista / Avvocato
    - Stato: INBOX
    - Priorità: P3
    - Tipo: FEAT
    - Descrizione: Marketplace di servizi professionali integrati.

- [SRV-002] Accesso al credito
    - Stato: INBOX
    - Priorità: P2
    - Tipo: INT

- [SRV-003] Sito Web
    - Stato: INBOX
    - Priorità: P3
    - Tipo: FEAT

- [SRV-004] Vendita/Consulenza in telepresenza (video call, calendario)
    - Stato: INBOX
    - Priorità: P2
    - Tipo: FEAT

- [SRV-005] Supporto commerciale, analisi marketing, alert trend
    - Stato: INBOX
    - Priorità: P3
    - Tipo: FEAT

- [SRV-006] Magazine/Redazionali (novità LP)
    - Stato: INBOX
    - Priorità: P3
    - Tipo: DOCS

---

## PLANNED

### Now (prossimo sprint)

-

### Next (in coda)

-

### Later (parcheggiate)

-

---

## DONE (storico sintetico)

-

---

## Note & decisioni

- Valutare quando promuovere i task “Operatività” in una pagina dedicata con filtri avanzati, mantenendo in dashboard solo KPI e quick-actions.
- Preferire sottoworkflow “tipizzati” (modelli) con parametri standard per uniformare tooltip e badge.
