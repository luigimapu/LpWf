USE tenant_gestionale;

-- Utenti base
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo)
VALUES
  ('Admin', 'Tenant', 'admin@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'ADMIN'),
  ('Mario', 'Operatore', 'operatore@example.com', '$2y$10$abcdefghijklmnopqrstuv', 'OPERATORE')
ON DUPLICATE KEY UPDATE ruolo = VALUES(ruolo);

-- Gruppi
INSERT INTO gruppi (nome, descrizione)
VALUES
  ('Commerciale', 'Team vendite e preventivi'),
  ('Supporto Tecnico', 'Team assistenza e ticket'),
  ('Contabilita', 'Gestione documenti e pagamenti')
ON DUPLICATE KEY UPDATE descrizione = VALUES(descrizione);

-- Relazioni utenti-gruppi
INSERT IGNORE INTO utenti_gruppi (utente_id, gruppo_id)
SELECT u.id,
       (SELECT id FROM gruppi WHERE nome = 'Commerciale' ORDER BY id LIMIT 1) AS gruppo_id
FROM utenti u
WHERE u.email = 'operatore@example.com';

-- Clienti demo
INSERT INTO clienti (ragione_sociale, partita_iva, email, tipo_cliente)
VALUES
  ('Cliente Demo S.r.l.', 'IT12345678901', 'cliente@example.com', 'AZIENDA'),
  ('Mario Rossi', NULL, 'mario.rossi@example.com', 'PRIVATO')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Fornitori demo
INSERT INTO fornitori (ragione_sociale, partita_iva, email)
VALUES
  ('Fornitore Auto S.p.A.', 'IT98765432109', 'fornitore@example.com')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Conti finanziari
INSERT INTO conti_finanziari (nome, tipologia, valuta, saldo_iniziale)
VALUES
  ('Cassa sede', 'CASSA', 'EUR', 1000.00),
  ('Banca principale', 'BANCA', 'EUR', 50000.00)
ON DUPLICATE KEY UPDATE saldo_iniziale = VALUES(saldo_iniziale);

-- Metodi di pagamento
INSERT INTO metodi_pagamento (nome, tipologia)
VALUES
  ('Bonifico bancario', 'BONIFICO'),
  ('Carta di credito', 'CARTA'),
  ('Gateway Stripe', 'GATEWAY_DIGITALE')
ON DUPLICATE KEY UPDATE tipologia = VALUES(tipologia);

-- Azioni standard principali
INSERT INTO azioni_standard (codice, nome, descrizione)
VALUES
  ('CREA_ORDINE', 'Crea ordine', 'Genera un ordine interno o marketplace'),
  ('VERIFICA_SCORTE_MAGAZZINO', 'Verifica scorte magazzino', 'Controlla disponibilità prodotti'),
  ('SUGGERISCI_RELATI', 'Suggerisci articoli correlati', 'Recupera upsell e servizi ausiliari'),
  ('GENERA_DOCUMENTO', 'Genera documento', 'Crea fatture, DDT o contratti'),
  ('RICHIEDI_PAGAMENTO_DIGITALE', 'Richiedi pagamento digitale', 'Genera link verso gateway'),
  ('REGISTRA_PAGAMENTO', 'Registra pagamento', 'Aggiorna stato incasso'),
  ('CREA_TICKET', 'Crea ticket assistenza', 'Apertura richiesta supporto'),
  ('INVIA_SOLLECITO_EMAIL', 'Invia sollecito', 'Reminder automatizzato per scadenze')
ON DUPLICATE KEY UPDATE descrizione = VALUES(descrizione);

-- Modello workflow demo (noleggio semplificato)
INSERT INTO workflow_modelli (nome, descrizione, attivo, creato_da)
VALUES ('Noleggio base', 'Workflow di riferimento per noleggio veicolo', 1,
       (SELECT id FROM utenti WHERE email = 'admin@example.com'))
ON DUPLICATE KEY UPDATE descrizione = VALUES(descrizione);

SET @workflow_id = (SELECT MIN(id) FROM workflow_modelli WHERE nome = 'Noleggio base');
SET @azione_crea = (SELECT id FROM azioni_standard WHERE codice = 'CREA_ORDINE');
SET @azione_scorte = (SELECT id FROM azioni_standard WHERE codice = 'VERIFICA_SCORTE_MAGAZZINO');
SET @azione_pagamento = (SELECT id FROM azioni_standard WHERE codice = 'RICHIEDI_PAGAMENTO_DIGITALE');
SET @azione_documento = (SELECT id FROM azioni_standard WHERE codice = 'GENERA_DOCUMENTO');

INSERT INTO workflow_passi (workflow_modello_id, nome_passo, ordine, sottopasso, tipo_azione_standard)
VALUES
  (@workflow_id, 'Creazione ordine', 1, 0, @azione_crea),
  (@workflow_id, 'Verifica disponibilità', 2, 0, @azione_scorte),
  (@workflow_id, 'Richiedi acconto', 3, 0, @azione_pagamento),
  (@workflow_id, 'Genera documento', 4, 0, @azione_documento)
ON DUPLICATE KEY UPDATE nome_passo = VALUES(nome_passo);

-- Documento demo (fattura)
INSERT INTO documenti (tipo_documento, numero, serie, data_emissione, cliente_id, stato, totale_imponibile, totale_imposta, totale_documento)
VALUES ('FATTURA', '1', 'A', CURDATE(),
        (SELECT id FROM clienti WHERE ragione_sociale = 'Cliente Demo S.r.l.' ORDER BY id LIMIT 1),
        'EMESSO', 1000.00, 220.00, 1220.00)
ON DUPLICATE KEY UPDATE totale_documento = VALUES(totale_documento);

SET @doc_id = (SELECT id FROM documenti WHERE tipo_documento = 'FATTURA' AND numero = '1' AND serie = 'A');

INSERT INTO documenti_righe (documento_id, descrizione, quantita, prezzo_unitario, totale_riga)
VALUES (@doc_id, 'Noleggio auto berlina - 3 giorni', 1, 1000.00, 1000.00)
ON DUPLICATE KEY UPDATE totale_riga = VALUES(totale_riga);

INSERT INTO documenti_aliquote (documento_id, aliquota, base_imponibile, imposta)
VALUES (@doc_id, 22.00, 1000.00, 220.00)
ON DUPLICATE KEY UPDATE imposta = VALUES(imposta);

INSERT INTO scadenze (documento_id, numero_rata, data_scadenza, importo)
VALUES
  (@doc_id, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 610.00),
  (@doc_id, 2, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 610.00)
ON DUPLICATE KEY UPDATE importo = VALUES(importo);

-- Pagamento demo collegato alla prima rata
INSERT INTO pagamenti (direzione, cliente_id, conti_finanziari_id, metodo_pagamento_id, importo, stato)
VALUES
  ('ENTRATA',
   (SELECT id FROM clienti WHERE ragione_sociale = 'Cliente Demo S.r.l.' ORDER BY id LIMIT 1),
   (SELECT id FROM conti_finanziari WHERE nome = 'Banca principale' ORDER BY id LIMIT 1),
   (SELECT id FROM metodi_pagamento WHERE nome = 'Bonifico bancario' ORDER BY id LIMIT 1),
   610.00,
   'REGISTRATO')
ON DUPLICATE KEY UPDATE importo = VALUES(importo);

SET @payment_id = LAST_INSERT_ID();
SET @scadenza_id = (SELECT id FROM scadenze WHERE documento_id = @doc_id ORDER BY numero_rata LIMIT 1);

INSERT INTO pagamenti_documenti (pagamento_id, documento_id, scadenza_id, importo_allocato)
VALUES (@payment_id, @doc_id, @scadenza_id, 610.00)
ON DUPLICATE KEY UPDATE importo_allocato = VALUES(importo_allocato);
