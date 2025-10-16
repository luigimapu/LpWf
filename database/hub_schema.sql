-- Schema hub centrale: catalogo e marketplace
-- Database target: MySQL 8.x (utf8mb4 / InnoDB)

CREATE DATABASE IF NOT EXISTS hub_catalogo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE hub_catalogo;

-- Tabella tenant
CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ragione_sociale VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  stato ENUM('ATTIVO', 'SOSPESO', 'IN_ONBOARDING') NOT NULL DEFAULT 'IN_ONBOARDING',
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenants_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set attributi
CREATE TABLE IF NOT EXISTS set_attributi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descrizione TEXT NULL,
  tipologia_destinazione ENUM('FISICO','SERVIZIO','DIGITALE','BUNDLE','ALTRO') NOT NULL DEFAULT 'ALTRO',
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attributi
CREATE TABLE IF NOT EXISTS attributi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  set_attributi_id BIGINT UNSIGNED NOT NULL,
  nome_tecnico VARCHAR(150) NOT NULL,
  etichetta VARCHAR(255) NOT NULL,
  tipo_dato ENUM('TESTO','NUMERO','BOOLEANO','SCELTA','JSON','DATA') NOT NULL,
  obbligatorio TINYINT(1) NOT NULL DEFAULT 0,
  opzioni JSON NULL,
  posizione SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attributi_set FOREIGN KEY (set_attributi_id) REFERENCES set_attributi(id) ON DELETE CASCADE,
  UNIQUE KEY uq_attributi_nome (set_attributi_id, nome_tecnico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Articoli
CREATE TABLE IF NOT EXISTS articoli (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  sku_globale VARCHAR(190) NOT NULL,
  codice_tenant VARCHAR(190) NULL,
  marca VARCHAR(150) NULL,
  modello VARCHAR(150) NULL,
  versione VARCHAR(150) NULL,
  tipologia ENUM('FISICO','SERVIZIO','DIGITALE','BUNDLE') NOT NULL,
  titolo VARCHAR(255) NOT NULL,
  sottotitolo VARCHAR(255) NULL,
  descrizione TEXT NULL,
  stato_pubblicazione ENUM('BOZZA','PUBBLICATO','ARCHIVIATO') NOT NULL DEFAULT 'BOZZA',
  visibilita ENUM('PRIVATO','MARKETPLACE','RISERVATO') NOT NULL DEFAULT 'PRIVATO',
  set_attributi_id BIGINT UNSIGNED NULL,
  metadati JSON NULL,
  pubblica_il DATETIME NULL,
  ritira_il DATETIME NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_il DATETIME NULL,
  CONSTRAINT fk_articoli_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_articoli_setattr FOREIGN KEY (set_attributi_id) REFERENCES set_attributi(id) ON DELETE SET NULL,
  UNIQUE KEY uq_articoli_sku (sku_globale),
  UNIQUE KEY uq_articoli_codice_tenant (tenant_id, codice_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varianti articolo
CREATE TABLE IF NOT EXISTS articoli_varianti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  articolo_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(190) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  attributi_override JSON NULL,
  stato ENUM('ATTIVO','INATTIVO') NOT NULL DEFAULT 'ATTIVO',
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_il DATETIME NULL,
  CONSTRAINT fk_varianti_articolo FOREIGN KEY (articolo_id) REFERENCES articoli(id) ON DELETE CASCADE,
  UNIQUE KEY uq_varianti_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valori attributi
CREATE TABLE IF NOT EXISTS valori_attributi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  articolo_id BIGINT UNSIGNED NOT NULL,
  variante_id BIGINT UNSIGNED NULL,
  attributo_id BIGINT UNSIGNED NOT NULL,
  valore_testo TEXT NULL,
  valore_numero DECIMAL(24,8) NULL,
  valore_booleano TINYINT(1) NULL,
  valore_json JSON NULL,
  CONSTRAINT fk_valori_articolo FOREIGN KEY (articolo_id) REFERENCES articoli(id) ON DELETE CASCADE,
  CONSTRAINT fk_valori_variante FOREIGN KEY (variante_id) REFERENCES articoli_varianti(id) ON DELETE CASCADE,
  CONSTRAINT fk_valori_attributo FOREIGN KEY (attributo_id) REFERENCES attributi(id) ON DELETE CASCADE,
  UNIQUE KEY uq_valori (articolo_id, variante_id, attributo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorie
CREATE TABLE IF NOT EXISTS categorie (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_padre_id BIGINT UNSIGNED NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  lft INT UNSIGNED NULL,
  rgt INT UNSIGNED NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categorie_padre FOREIGN KEY (categoria_padre_id) REFERENCES categorie(id) ON DELETE SET NULL,
  UNIQUE KEY uq_categorie_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collegamento articoli-categorie
CREATE TABLE IF NOT EXISTS articoli_categorie (
  articolo_id BIGINT UNSIGNED NOT NULL,
  categoria_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (articolo_id, categoria_id),
  CONSTRAINT fk_artcat_articolo FOREIGN KEY (articolo_id) REFERENCES articoli(id) ON DELETE CASCADE,
  CONSTRAINT fk_artcat_categoria FOREIGN KEY (categoria_id) REFERENCES categorie(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bundle
CREATE TABLE IF NOT EXISTS bundle (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  articolo_id BIGINT UNSIGNED NOT NULL,
  strategia_prezzo ENUM('FISSO','DINAMICO','SCONTO_PERCENTUALE') NOT NULL DEFAULT 'FISSO',
  prezzo_bundle DECIMAL(18,2) NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bundle_articolo FOREIGN KEY (articolo_id) REFERENCES articoli(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bundle_articolo (articolo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Componenti bundle
CREATE TABLE IF NOT EXISTS bundle_componenti (
  bundle_id BIGINT UNSIGNED NOT NULL,
  articolo_component_id BIGINT UNSIGNED NOT NULL,
  quantita DECIMAL(10,3) NOT NULL DEFAULT 1,
  opzionale TINYINT(1) NOT NULL DEFAULT 0,
  preselezionato TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, articolo_component_id),
  CONSTRAINT fk_bundlecomp_bundle FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE,
  CONSTRAINT fk_bundlecomp_articolo FOREIGN KEY (articolo_component_id) REFERENCES articoli(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relazioni articoli (upsell, cross-sell)
CREATE TABLE IF NOT EXISTS articoli_relazioni (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  articolo_sorgente_id BIGINT UNSIGNED NOT NULL,
  articolo_correlato_id BIGINT UNSIGNED NOT NULL,
  tipo_relazione ENUM('UPSELL','CROSS_SELL','SERVIZIO_AUSILIARIO','SOSTITUTIVO','ADD_ON') NOT NULL,
  priorita SMALLINT NOT NULL DEFAULT 0,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_relazioni_source FOREIGN KEY (articolo_sorgente_id) REFERENCES articoli(id) ON DELETE CASCADE,
  CONSTRAINT fk_relazioni_target FOREIGN KEY (articolo_correlato_id) REFERENCES articoli(id) ON DELETE CASCADE,
  UNIQUE KEY uq_relazione (articolo_sorgente_id, articolo_correlato_id, tipo_relazione)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scorte per variante e tenant
CREATE TABLE IF NOT EXISTS scorte (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  variante_id BIGINT UNSIGNED NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  magazzino_id VARCHAR(100) NOT NULL DEFAULT '',
  quantita_totale DECIMAL(18,3) NOT NULL DEFAULT 0,
  quantita_riservata DECIMAL(18,3) NOT NULL DEFAULT 0,
  quantita_disponibile DECIMAL(18,3) NOT NULL DEFAULT 0,
  versione_sync INT UNSIGNED NOT NULL DEFAULT 0,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scorte_variante FOREIGN KEY (variante_id) REFERENCES articoli_varianti(id) ON DELETE CASCADE,
  CONSTRAINT fk_scorte_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_scorte (variante_id, tenant_id, magazzino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listini
CREATE TABLE IF NOT EXISTS listini (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  codice VARCHAR(120) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  valuta CHAR(3) NOT NULL,
  valido_dal DATE NULL,
  valido_al DATE NULL,
  priorita SMALLINT NOT NULL DEFAULT 0,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_listini_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_listini (tenant_id, codice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prezzi articoli
CREATE TABLE IF NOT EXISTS prezzi_articoli (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listino_id BIGINT UNSIGNED NOT NULL,
  variante_id BIGINT UNSIGNED NOT NULL,
  prezzo DECIMAL(18,4) NOT NULL,
  prezzo_confronto DECIMAL(18,4) NULL,
  quantita_minima DECIMAL(12,3) NULL,
  quantita_massima DECIMAL(12,3) NULL,
  condizioni JSON NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prezzi_listino FOREIGN KEY (listino_id) REFERENCES listini(id) ON DELETE CASCADE,
  CONSTRAINT fk_prezzi_variante FOREIGN KEY (variante_id) REFERENCES articoli_varianti(id) ON DELETE CASCADE,
  UNIQUE KEY uq_prezzo (listino_id, variante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Slot disponibilità (per servizi)
CREATE TABLE IF NOT EXISTS disponibilita_slot (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  variante_id BIGINT UNSIGNED NOT NULL,
  inizio DATETIME NOT NULL,
  fine DATETIME NOT NULL,
  capacita_totale INT UNSIGNED NOT NULL DEFAULT 1,
  capacita_prenotata INT UNSIGNED NOT NULL DEFAULT 0,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_slot_variante FOREIGN KEY (variante_id) REFERENCES articoli_varianti(id) ON DELETE CASCADE,
  UNIQUE KEY uq_slot (variante_id, inizio, fine)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risorse multimediali
CREATE TABLE IF NOT EXISTS risorse_multimediali (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  articolo_id BIGINT UNSIGNED NOT NULL,
  tipologia ENUM('IMMAGINE','DOCUMENTO','VIDEO','ALTRO') NOT NULL DEFAULT 'IMMAGINE',
  url VARCHAR(500) NOT NULL,
  testo_alternativo VARCHAR(255) NULL,
  posizione SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_articolo FOREIGN KEY (articolo_id) REFERENCES articoli(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventi di sincronizzazione ricevuti dai tenant
CREATE TABLE IF NOT EXISTS eventi_sync (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  entita ENUM('ARTICOLO','VARIANTE','SCORTA','PREZZO','DISPONIBILITA','DOCUMENTO','RELAZIONE','BUNDLE','ALTRO') NOT NULL,
  entita_id VARCHAR(191) NULL,
  tipo_evento ENUM('CREA','AGGIORNA','ELIMINA','SET') NOT NULL,
  payload JSON NULL,
  stato_elaborazione ENUM('IN_ATTESA','ELABORATO','ERRORE') NOT NULL DEFAULT 'IN_ATTESA',
  elaborato_il DATETIME NULL,
  errore TEXT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventisync_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_eventisync_stato (stato_elaborazione),
  INDEX idx_eventisync_entita (entita, entita_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro centrale dei codici SKU globali (sequenziali)
CREATE TABLE IF NOT EXISTS sku_protocolli (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku_code VARCHAR(64) NULL,
  articolo_id BIGINT UNSIGNED NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_ip VARCHAR(64) NULL,
  created_user_agent VARCHAR(255) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sku_code (sku_code),
  KEY idx_sku_articolo (articolo_id),
  KEY idx_sku_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clienti (anagrafica centralizzata)
CREATE TABLE IF NOT EXISTS clienti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(50) NULL,
  codice_fiscale VARCHAR(50) NULL,
  email VARCHAR(190) NULL,
  telefono VARCHAR(50) NULL,
  indirizzo VARCHAR(255) NULL,
  cap VARCHAR(20) NULL,
  citta VARCHAR(120) NULL,
  provincia VARCHAR(50) NULL,
  nazione VARCHAR(60) NULL,
  tipo_cliente ENUM('AZIENDA','PRIVATO','PA','TENANT') NOT NULL DEFAULT 'AZIENDA',
  tenant_assoc_id BIGINT UNSIGNED NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clienti_piva (partita_iva),
  UNIQUE KEY uq_clienti_cf (codice_fiscale),
  CONSTRAINT fk_clienti_tenant_assoc FOREIGN KEY (tenant_assoc_id) REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mappatura clienti hub <-> identità tenant
CREATE TABLE IF NOT EXISTS clienti_tenant_map (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT UNSIGNED NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  cliente_id_tenant VARCHAR(190) NULL,
  cliente_codice_tenant VARCHAR(190) NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_climap_cliente FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE CASCADE,
  CONSTRAINT fk_climap_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_climap_id_tenant (tenant_id, cliente_id_tenant),
  UNIQUE KEY uq_climap_codice_tenant (tenant_id, cliente_codice_tenant),
  KEY idx_climap_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
