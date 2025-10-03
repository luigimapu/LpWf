-- Schema tenant gestionale
-- Database target: MySQL 8.x (utf8mb4 / InnoDB)

CREATE DATABASE IF NOT EXISTS tenant_gestionale
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tenant_gestionale;

-- Utenti applicazione
CREATE TABLE IF NOT EXISTS utenti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ruolo VARCHAR(60) NOT NULL DEFAULT 'OPERATORE',
  stato ENUM('ATTIVO','DISABILITATO') NOT NULL DEFAULT 'ATTIVO',
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_accesso DATETIME NULL,
  UNIQUE KEY uq_utenti_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clienti
CREATE TABLE IF NOT EXISTS clienti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(50) NULL,
  codice_fiscale VARCHAR(50) NULL,
  indirizzo VARCHAR(255) NULL,
  cap VARCHAR(20) NULL,
  citta VARCHAR(120) NULL,
  provincia VARCHAR(50) NULL,
  nazione VARCHAR(60) NULL,
  email VARCHAR(190) NULL,
  telefono VARCHAR(50) NULL,
  tipo_cliente ENUM('AZIENDA','PRIVATO','PA') NOT NULL DEFAULT 'AZIENDA',
  note TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_il DATETIME NULL,
  UNIQUE KEY uq_clienti_piva (partita_iva)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fornitori
CREATE TABLE IF NOT EXISTS fornitori (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(50) NULL,
  codice_fiscale VARCHAR(50) NULL,
  indirizzo VARCHAR(255) NULL,
  cap VARCHAR(20) NULL,
  citta VARCHAR(120) NULL,
  provincia VARCHAR(50) NULL,
  nazione VARCHAR(60) NULL,
  email VARCHAR(190) NULL,
  telefono VARCHAR(50) NULL,
  note TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_il DATETIME NULL,
  UNIQUE KEY uq_fornitori_piva (partita_iva)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conti finanziari
CREATE TABLE IF NOT EXISTS conti_finanziari (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  tipologia ENUM('CASSA','BANCA','CARTA','GATEWAY_DIGITALE','ALTRO') NOT NULL,
  valuta CHAR(3) NOT NULL DEFAULT 'EUR',
  saldo_iniziale DECIMAL(18,2) NOT NULL DEFAULT 0,
  iban VARCHAR(34) NULL,
  bic VARCHAR(20) NULL,
  dettagli_gateway JSON NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metodi di pagamento
CREATE TABLE IF NOT EXISTS metodi_pagamento (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipologia ENUM('BONIFICO','CARTA','RID','CONTANTI','GATEWAY_DIGITALE','ALTRO') NOT NULL,
  parametri JSON NULL,
  attivo TINYINT(1) NOT NULL DEFAULT 1,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gruppi di utenti
CREATE TABLE IF NOT EXISTS gruppi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descrizione TEXT NULL,
  attivo TINYINT(1) NOT NULL DEFAULT 1,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relazione utenti-gruppi
CREATE TABLE IF NOT EXISTS utenti_gruppi (
  utente_id BIGINT UNSIGNED NOT NULL,
  gruppo_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (utente_id, gruppo_id),
  CONSTRAINT fk_utentigruppi_utente FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE,
  CONSTRAINT fk_utentigruppi_gruppo FOREIGN KEY (gruppo_id) REFERENCES gruppi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Azioni standard workflow
CREATE TABLE IF NOT EXISTS azioni_standard (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codice VARCHAR(120) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT NULL,
  parametri_richiesti JSON NULL,
  handler VARCHAR(190) NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_azioni_codice (codice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modelli workflow
CREATE TABLE IF NOT EXISTS workflow_modelli (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT NULL,
  attivo TINYINT(1) NOT NULL DEFAULT 1,
  creato_da BIGINT UNSIGNED NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_workflowmodelli_creatore FOREIGN KEY (creato_da) REFERENCES utenti(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Passi workflow
CREATE TABLE IF NOT EXISTS workflow_passi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workflow_modello_id BIGINT UNSIGNED NOT NULL,
  nome_passo VARCHAR(255) NOT NULL,
  descrizione TEXT NULL,
  ordine INT NOT NULL DEFAULT 1,
  sottopasso INT NOT NULL DEFAULT 0,
  tipo_azione_standard BIGINT UNSIGNED NULL,
  parametri_azione JSON NULL,
  scadenza_standard_valore INT NULL,
  scadenza_standard_unita ENUM('ORE','GIORNI') NULL,
  responsabile_utente_id BIGINT UNSIGNED NULL,
  responsabile_gruppo_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_passi_modello FOREIGN KEY (workflow_modello_id) REFERENCES workflow_modelli(id) ON DELETE CASCADE,
  CONSTRAINT fk_passi_azione FOREIGN KEY (tipo_azione_standard) REFERENCES azioni_standard(id) ON DELETE SET NULL,
  CONSTRAINT fk_passi_responsabile FOREIGN KEY (responsabile_utente_id) REFERENCES utenti(id) ON DELETE SET NULL,
  CONSTRAINT fk_passi_gruppo FOREIGN KEY (responsabile_gruppo_id) REFERENCES gruppi(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Istanze workflow
CREATE TABLE IF NOT EXISTS workflow_istanze (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workflow_modello_id BIGINT UNSIGNED NOT NULL,
  id_istanza_padre BIGINT UNSIGNED NULL,
  entita_collegata_tipo VARCHAR(120) NULL,
  entita_collegata_id VARCHAR(120) NULL,
  stato ENUM('IN_CORSO','COMPLETATO','ANNULLATO','SOSPESO') NOT NULL DEFAULT 'IN_CORSO',
  avviato_da BIGINT UNSIGNED NULL,
  avviato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completato_il DATETIME NULL,
  CONSTRAINT fk_istanze_modello FOREIGN KEY (workflow_modello_id) REFERENCES workflow_modelli(id) ON DELETE CASCADE,
  CONSTRAINT fk_istanze_avviato FOREIGN KEY (avviato_da) REFERENCES utenti(id) ON DELETE SET NULL,
  CONSTRAINT fk_istanze_padre FOREIGN KEY (id_istanza_padre) REFERENCES workflow_istanze(id) ON DELETE SET NULL,
  INDEX idx_istanze_entita (entita_collegata_tipo, entita_collegata_id),
  INDEX idx_istanze_padre (id_istanza_padre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task workflow
CREATE TABLE IF NOT EXISTS workflow_task (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workflow_istanza_id BIGINT UNSIGNED NOT NULL,
  workflow_passo_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT NULL,
  stato ENUM('APERTO','IN_LAVORAZIONE','COMPLETATO','ANNULLATO') NOT NULL DEFAULT 'APERTO',
  assegnato_a_utente_id BIGINT UNSIGNED NULL,
  assegnato_il DATETIME NULL,
  completato_il DATETIME NULL,
  note TEXT NULL,
  CONSTRAINT fk_task_istanza FOREIGN KEY (workflow_istanza_id) REFERENCES workflow_istanze(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_passo FOREIGN KEY (workflow_passo_id) REFERENCES workflow_passi(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_assegnato FOREIGN KEY (assegnato_a_utente_id) REFERENCES utenti(id) ON DELETE SET NULL,
  INDEX idx_task_stato (stato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documenti

-- Note sui task
CREATE TABLE IF NOT EXISTS task_note (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_task BIGINT UNSIGNED NOT NULL,
  id_utente BIGINT UNSIGNED NOT NULL,
  nota TEXT NOT NULL,
  data_creazione DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasknote_task FOREIGN KEY (id_task) REFERENCES workflow_task(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasknote_utente FOREIGN KEY (id_utente) REFERENCES utenti(id) ON DELETE CASCADE,
  INDEX idx_tasknote_task (id_task)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_note_allegati (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_nota BIGINT UNSIGNED NOT NULL,
  nome_file_originale VARCHAR(255) NOT NULL,
  percorso_file VARCHAR(255) NOT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tna_nota FOREIGN KEY (id_nota) REFERENCES task_note(id) ON DELETE CASCADE,
  INDEX idx_tna_nota (id_nota)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documenti
CREATE TABLE IF NOT EXISTS documenti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('FATTURA','NOTA_CREDITO','DDT','ORDINE','CONTRATTO','ALTRO') NOT NULL,
  numero VARCHAR(60) NOT NULL,
  serie VARCHAR(20) NULL,
  data_emissione DATE NOT NULL,
  cliente_id BIGINT UNSIGNED NULL,
  fornitore_id BIGINT UNSIGNED NULL,
  stato ENUM('BOZZA','EMESSO','INVIATO','ANNULLATO') NOT NULL DEFAULT 'BOZZA',
  totale_imponibile DECIMAL(18,2) NOT NULL DEFAULT 0,
  totale_imposta DECIMAL(18,2) NOT NULL DEFAULT 0,
  totale_documento DECIMAL(18,2) NOT NULL DEFAULT 0,
  valuta CHAR(3) NOT NULL DEFAULT 'EUR',
  note TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_documenti_cliente FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE SET NULL,
  CONSTRAINT fk_documenti_fornitore FOREIGN KEY (fornitore_id) REFERENCES fornitori(id) ON DELETE SET NULL,
  UNIQUE KEY uq_documenti_numero (tipo_documento, serie, numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Righe documento
CREATE TABLE IF NOT EXISTS documenti_righe (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  documento_id BIGINT UNSIGNED NOT NULL,
  articolo_id BIGINT UNSIGNED NULL,
  descrizione TEXT NOT NULL,
  quantita DECIMAL(18,4) NOT NULL DEFAULT 1,
  unita_misura VARCHAR(20) NULL,
  prezzo_unitario DECIMAL(18,4) NOT NULL DEFAULT 0,
  sconto_percentuale DECIMAL(6,3) NULL,
  aliquota_iva DECIMAL(5,2) NULL,
  totale_riga DECIMAL(18,4) NOT NULL DEFAULT 0,
  CONSTRAINT fk_righe_documento FOREIGN KEY (documento_id) REFERENCES documenti(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aliquote documento
CREATE TABLE IF NOT EXISTS documenti_aliquote (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  documento_id BIGINT UNSIGNED NOT NULL,
  aliquota DECIMAL(5,2) NOT NULL,
  base_imponibile DECIMAL(18,2) NOT NULL,
  imposta DECIMAL(18,2) NOT NULL,
  CONSTRAINT fk_docaliquote_documento FOREIGN KEY (documento_id) REFERENCES documenti(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allegati documento
CREATE TABLE IF NOT EXISTS documenti_allegati (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  documento_id BIGINT UNSIGNED NOT NULL,
  nome_file VARCHAR(255) NOT NULL,
  percorso VARCHAR(400) NOT NULL,
  tipo_allegato VARCHAR(100) NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_docallegati_documento FOREIGN KEY (documento_id) REFERENCES documenti(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scadenze di pagamento
CREATE TABLE IF NOT EXISTS scadenze (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  documento_id BIGINT UNSIGNED NOT NULL,
  numero_rata INT NOT NULL DEFAULT 1,
  data_scadenza DATE NOT NULL,
  importo DECIMAL(18,2) NOT NULL,
  stato ENUM('DA_PAGARE','PAGATA','INSOLUTA','RIMANDATA') NOT NULL DEFAULT 'DA_PAGARE',
  note TEXT NULL,
  CONSTRAINT fk_scadenze_documento FOREIGN KEY (documento_id) REFERENCES documenti(id) ON DELETE CASCADE,
  INDEX idx_scadenze_stato (stato, data_scadenza)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pagamenti
CREATE TABLE IF NOT EXISTS pagamenti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  direzione ENUM('ENTRATA','USCITA') NOT NULL,
  cliente_id BIGINT UNSIGNED NULL,
  fornitore_id BIGINT UNSIGNED NULL,
  conti_finanziari_id BIGINT UNSIGNED NOT NULL,
  metodo_pagamento_id BIGINT UNSIGNED NULL,
  importo DECIMAL(18,2) NOT NULL,
  valuta CHAR(3) NOT NULL DEFAULT 'EUR',
  data_pagamento DATE NULL,
  stato ENUM('PREVISTO','REGISTRATO','IN_ATTESA','ANNULLATO') NOT NULL DEFAULT 'PREVISTO',
  riferimento_esterno VARCHAR(190) NULL,
  note TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamenti_cliente FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagamenti_fornitore FOREIGN KEY (fornitore_id) REFERENCES fornitori(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagamenti_conto FOREIGN KEY (conti_finanziari_id) REFERENCES conti_finanziari(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pagamenti_metodo FOREIGN KEY (metodo_pagamento_id) REFERENCES metodi_pagamento(id) ON DELETE SET NULL,
  INDEX idx_pagamenti_stato (stato, direzione)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collegamento pagamenti-documenti
CREATE TABLE IF NOT EXISTS pagamenti_documenti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pagamento_id BIGINT UNSIGNED NOT NULL,
  documento_id BIGINT UNSIGNED NOT NULL,
  scadenza_id BIGINT UNSIGNED NULL,
  importo_allocato DECIMAL(18,2) NOT NULL,
  CONSTRAINT fk_paydoc_pagamento FOREIGN KEY (pagamento_id) REFERENCES pagamenti(id) ON DELETE CASCADE,
  CONSTRAINT fk_paydoc_documento FOREIGN KEY (documento_id) REFERENCES documenti(id) ON DELETE CASCADE,
  CONSTRAINT fk_paydoc_scadenza FOREIGN KEY (scadenza_id) REFERENCES scadenze(id) ON DELETE SET NULL,
  INDEX idx_pagdoc_pagamento (pagamento_id),
  INDEX idx_pagdoc_documento (documento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER bi_pagamenti_documenti
BEFORE INSERT ON pagamenti_documenti
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM pagamenti_documenti
      WHERE pagamento_id = NEW.pagamento_id
        AND documento_id = NEW.documento_id
        AND (
              (scadenza_id IS NULL AND NEW.scadenza_id IS NULL)
              OR (scadenza_id IS NOT NULL AND NEW.scadenza_id IS NOT NULL AND scadenza_id = NEW.scadenza_id)
            )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicazione pagamento/documento/scadenza';
  END IF;
END$$

CREATE TRIGGER bu_pagamenti_documenti
BEFORE UPDATE ON pagamenti_documenti
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM pagamenti_documenti
      WHERE pagamento_id = NEW.pagamento_id
        AND documento_id = NEW.documento_id
        AND (
              (scadenza_id IS NULL AND NEW.scadenza_id IS NULL)
              OR (scadenza_id IS NOT NULL AND NEW.scadenza_id IS NOT NULL AND scadenza_id = NEW.scadenza_id)
            )
        AND id <> OLD.id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicazione pagamento/documento/scadenza';
  END IF;
END$$
DELIMITER ;

-- Transazioni gateway
CREATE TABLE IF NOT EXISTS transazioni_gateway (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pagamento_id BIGINT UNSIGNED NOT NULL,
  gateway VARCHAR(100) NOT NULL,
  stato VARCHAR(50) NOT NULL,
  richiesta_payload JSON NULL,
  risposta_payload JSON NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gateway_pagamento FOREIGN KEY (pagamento_id) REFERENCES pagamenti(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prima nota (movimenti contabili semplificati)
CREATE TABLE IF NOT EXISTS prima_nota (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conti_finanziari_id BIGINT UNSIGNED NOT NULL,
  riferimento_documento_id BIGINT UNSIGNED NULL,
  data_movimento DATE NOT NULL,
  descrizione VARCHAR(255) NULL,
  importo DECIMAL(18,2) NOT NULL,
  tipo_movimento ENUM('ENTRATA','USCITA','GIROCONTO') NOT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_primanota_conto FOREIGN KEY (conti_finanziari_id) REFERENCES conti_finanziari(id) ON DELETE CASCADE,
  CONSTRAINT fk_primanota_documento FOREIGN KEY (riferimento_documento_id) REFERENCES documenti(id) ON DELETE SET NULL,
  INDEX idx_primanota_data (data_movimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventi di sincronizzazione in uscita verso hub
CREATE TABLE IF NOT EXISTS sync_uscita (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entita ENUM('ARTICOLO','VARIANTE','SCORTA','PREZZO','DISPONIBILITA','DOCUMENTO','RELAZIONE','BUNDLE','ALTRO') NOT NULL,
  entita_id VARCHAR(191) NULL,
  tipo_evento ENUM('CREA','AGGIORNA','ELIMINA','SET') NOT NULL,
  payload JSON NULL,
  stato ENUM('IN_ATTESA','INVIATO','ERRORE') NOT NULL DEFAULT 'IN_ATTESA',
  tentativi SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ultimo_tentativo_il DATETIME NULL,
  errore TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_syncuscita_stato (stato),
  INDEX idx_syncuscita_entita (entita, entita_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log dei sincronismi
CREATE TABLE IF NOT EXISTS log_sync (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sync_uscita_id BIGINT UNSIGNED NULL,
  entita ENUM('ARTICOLO','VARIANTE','SCORTA','PREZZO','DISPONIBILITA','DOCUMENTO','RELAZIONE','BUNDLE','ALTRO') NOT NULL,
  entita_id VARCHAR(191) NULL,
  direzione ENUM('VERSO_HUB','DA_HUB') NOT NULL,
  stato ENUM('OK','WARN','ERRORE') NOT NULL,
  messaggio TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logsync_syncuscita FOREIGN KEY (sync_uscita_id) REFERENCES sync_uscita(id) ON DELETE SET NULL,
  INDEX idx_logsync_entita (entita, entita_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
