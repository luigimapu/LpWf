<?php
// Setup/seed tenant_gestionale database using env DB_* (tenant side)
// Usage: php tools/setup_tenant_db.php

require_once __DIR__ . '/../config/env_loader.php';

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) { loadEnv($envFile, true); }

$host = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'tenant_gestionale';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASS') ?: '';

if ($user === '') {
    fwrite(STDERR, "DB_USER non configurato in .env\n");
    exit(1);
}

function runSqlTenant(PDO $pdo, string $sql): void {
    $delimiter = ';';
    $buffer = '';
    $inCommentBlock = false;
    $lines = preg_split("/\r?\n/", $sql);
    foreach ($lines as $rawLine) {
        $line = $rawLine;
        $trim = ltrim($line);
        // Handle comment blocks /* ... */
        if ($inCommentBlock) {
            if (str_contains($trim, '*/')) {
                $inCommentBlock = false;
            }
            continue;
        }
        if (str_starts_with($trim, '/*')) {
            if (!str_contains($trim, '*/')) { $inCommentBlock = true; }
            continue;
        }
        // Skip single-line comments
        if ($trim === '' || str_starts_with($trim, '--') || str_starts_with($trim, '#')) {
            continue;
        }
        // Handle DELIMITER changes
        if (preg_match('/^DELIMITER\s+(.+)$/i', trim($line), $m)) {
            $delimiter = $m[1];
            continue;
        }
        $buffer .= $line . "\n";
        // Check if buffer ends with current delimiter
        $cmp = rtrim($buffer);
        if ($delimiter !== '' && str_ends_with($cmp, $delimiter)) {
            $stmt = substr($cmp, 0, -strlen($delimiter));
            $stmt = trim($stmt);
            if ($stmt !== '') {
                try {
                    $pdo->exec($stmt);
                } catch (PDOException $e) {
                    // Rende idempotente: ignora errori comuni di "già esiste" o "non esiste" su CREATE/ALTER/DROP/INSERT
                    $err = $e->errorInfo[1] ?? null; // Codice errore MySQL (es. 1359 trigger già esistente)
                    $head = strtoupper(substr(ltrim($stmt), 0, 20));
                    $isCreate = str_starts_with($head, 'CREATE');
                    $isAlter  = str_starts_with($head, 'ALTER');
                    $isDrop   = str_starts_with($head, 'DROP');
                    $isInsert = str_starts_with($head, 'INSERT');

                    $ignorable = false;
                    // Trigger già esistente
                    if ($isCreate && $err === 1359) { $ignorable = true; }
                    // Table già esistente
                    if ($isCreate && $err === 1050) { $ignorable = true; }
                    // Colonna già esistente
                    if ($isAlter && $err === 1060) { $ignorable = true; }
                    // Indice già esistente
                    if ($isAlter && $err === 1061) { $ignorable = true; }
                    // Drop di oggetti inesistenti (colonna/indice/trigger/tabella)
                    if ($isDrop && in_array($err, [1091, 1305], true)) { $ignorable = true; }
                    // INSERT duplicata (seed)
                    if ($isInsert && $err === 1062) { $ignorable = true; }

                    if ($ignorable) {
                        fwrite(STDERR, "[IGNORA] Errore idempotenza: " . ($e->errorInfo[2] ?? $e->getMessage()) . "\n");
                    } else {
                        throw $e;
                    }
                }
            }
            $buffer = '';
        }
    }
    // Execute remaining buffer if any
    $stmt = trim($buffer);
    if ($stmt !== '') {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            $err = $e->errorInfo[1] ?? null;
            $head = strtoupper(substr(ltrim($stmt), 0, 20));
            $isCreate = str_starts_with($head, 'CREATE');
            $isAlter  = str_starts_with($head, 'ALTER');
            $isDrop   = str_starts_with($head, 'DROP');
            $isInsert = str_starts_with($head, 'INSERT');
            $ignorable = false;
            if ($isCreate && $err === 1359) { $ignorable = true; }
            if ($isCreate && $err === 1050) { $ignorable = true; }
            if ($isAlter && $err === 1060) { $ignorable = true; }
            if ($isAlter && $err === 1061) { $ignorable = true; }
            if ($isDrop && in_array($err, [1091, 1305], true)) { $ignorable = true; }
            if ($isInsert && $err === 1062) { $ignorable = true; }
            if ($ignorable) {
                fwrite(STDERR, "[IGNORA] Errore idempotenza: " . ($e->errorInfo[2] ?? $e->getMessage()) . "\n");
            } else {
                throw $e;
            }
        }
    }
}

try {
    $pdo = new PDO('mysql:host=' . $host . ';charset=utf8mb4', $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $e) {
    fwrite(STDERR, "Connessione fallita: " . $e->getMessage() . "\n");
    exit(2);
}

echo "Creazione database tenant se mancante…\n";
$pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci");
$pdo->exec("USE `{$dbName}`");

$schemaPath = __DIR__ . '/../database/tenant_schema.sql';
if (is_readable($schemaPath)) {
    echo "Eseguo schema: database/tenant_schema.sql…\n";
    $sql = file_get_contents($schemaPath);
    runSqlTenant($pdo, $sql);
} else {
    echo "Schema mancante: {$schemaPath}\n";
}

$preDedup = function() use ($pdo): void {
    try {
        echo "Pre-deduplica tabelle per idempotenza…\n";
        $pdo->exec("DELETE t1 FROM workflow_modelli t1 JOIN workflow_modelli t2 ON t1.nome = t2.nome AND t1.id > t2.id");
        $pdo->exec("DELETE t1 FROM gruppi t1 JOIN gruppi t2 ON t1.nome = t2.nome AND t1.id > t2.id");
        $pdo->exec("DELETE t1 FROM conti_finanziari t1 JOIN conti_finanziari t2 ON t1.nome = t2.nome AND t1.id > t2.id");
        $pdo->exec("DELETE t1 FROM metodi_pagamento t1 JOIN metodi_pagamento t2 ON t1.nome = t2.nome AND t1.id > t2.id");
    } catch (Throwable $e) {
        fwrite(STDERR, "Avviso: pre-dedup fallita: " . $e->getMessage() . "\n");
    }
};

$preDedup();

$seedPath = __DIR__ . '/../database/tenant_seed.sql';
if (is_readable($seedPath)) {
    echo "Eseguo seed: database/tenant_seed.sql…\n";
    $sql = file_get_contents($seedPath);
    runSqlTenant($pdo, $sql);
} else {
    echo "Seed mancante: {$seedPath}\n";
}

// Deduplica dati seed potenzialmente duplicati e imposta vincoli univoci
try {
    echo "Deduplica tabelle chiave (nome)…\n";
    $pdo->exec("DELETE t1 FROM conti_finanziari t1 JOIN conti_finanziari t2 ON t1.nome = t2.nome AND t1.id > t2.id");
    $pdo->exec("DELETE t1 FROM metodi_pagamento t1 JOIN metodi_pagamento t2 ON t1.nome = t2.nome AND t1.id > t2.id");
    $pdo->exec("DELETE t1 FROM gruppi t1 JOIN gruppi t2 ON t1.nome = t2.nome AND t1.id > t2.id");
    $pdo->exec("DELETE t1 FROM workflow_modelli t1 JOIN workflow_modelli t2 ON t1.nome = t2.nome AND t1.id > t2.id");

    $ensureUnique = function(string $table, string $indexName, string $column) use ($pdo): void {
        $sql = "SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :t AND index_name = :i";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':t' => $table, ':i' => $indexName]);
        $exists = (int)$stmt->fetchColumn() > 0;
        if (!$exists) {
            echo "Aggiungo indice univoco {$indexName} su {$table}({$column})…\n";
            $pdo->exec("ALTER TABLE `{$table}` ADD UNIQUE KEY `{$indexName}` (`{$column}`)");
        }
    };

    $ensureUnique('conti_finanziari', 'uq_conti_finanziari_nome', 'nome');
    $ensureUnique('metodi_pagamento', 'uq_metodi_pagamento_nome', 'nome');
    $ensureUnique('gruppi', 'uq_gruppi_nome', 'nome');
    $ensureUnique('workflow_modelli', 'uq_workflow_modelli_nome', 'nome');
} catch (Throwable $e) {
    fwrite(STDERR, "Avviso: dedup/unique fallita: " . $e->getMessage() . "\n");
}

// Log servizi integrazione (idempotente)
try {
    echo "Verifico tabella service_logs…\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS service_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service VARCHAR(64) NOT NULL,
  action VARCHAR(64) NULL,
  provider VARCHAR(64) NULL,
  status VARCHAR(16) NULL,
  http_code INT NULL,
  request JSON NULL,
  response JSON NULL,
  user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_service_logs_created_at (created_at),
  INDEX idx_service_logs_service (service)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Throwable $e) {
    fwrite(STDERR, "Avviso: creazione service_logs fallita: " . $e->getMessage() . "\n");
}

// Ticketing (idempotente)
try {
    echo "Verifico tabelle ticketing…\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT NULL,
  priorita ENUM('BASSA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  stato ENUM('APERTO','IN_LAVORAZIONE','CHIUSO') NOT NULL DEFAULT 'APERTO',
  creato_da BIGINT UNSIGNED NOT NULL,
  assegnato_a BIGINT UNSIGNED NULL,
  cliente_id BIGINT UNSIGNED NULL,
  categoria VARCHAR(120) NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  chiuso_il DATETIME NULL,
  CONSTRAINT fk_tickets_creatore FOREIGN KEY (creato_da) REFERENCES utenti(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_assegnatario FOREIGN KEY (assegnato_a) REFERENCES utenti(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_cliente FOREIGN KEY (cliente_id) REFERENCES clienti(id) ON DELETE SET NULL,
  INDEX idx_tickets_stato (stato),
  INDEX idx_tickets_priorita (priorita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS ticket_commenti (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT UNSIGNED NOT NULL,
  utente_id BIGINT UNSIGNED NOT NULL,
  messaggio TEXT NOT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ticket_commenti_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_commenti_utente FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE,
  INDEX idx_ticket_commenti_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS ticket_allegati (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  commento_id BIGINT UNSIGNED NOT NULL,
  nome_file_originale VARCHAR(255) NOT NULL,
  percorso_file VARCHAR(255) NOT NULL,
  creato_il DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ticket_allegati_commento FOREIGN KEY (commento_id) REFERENCES ticket_commenti(id) ON DELETE CASCADE,
  INDEX idx_ticket_allegati_commento (commento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Throwable $e) {
    fwrite(STDERR, "Avviso: creazione schema ticketing fallita: " . $e->getMessage() . "\n");
}

// Azioni standard: imposta parametri_richiesti per azioni note (idempotente)
try {
    $defs = [
        'CREA_ORDINE' => [
            ['name' => 'canale', 'label' => 'Canale', 'type' => 'select', 'options' => ['INTERNO','MARKETPLACE']],
            ['name' => 'note', 'label' => 'Note', 'type' => 'text', 'placeholder' => 'Note ordine'],
        ],
        'VERIFICA_SCORTE_MAGAZZINO' => [
            ['name' => 'soglia_minima', 'label' => 'Soglia minima', 'type' => 'number', 'placeholder' => '0'],
            ['name' => 'magazzino', 'label' => 'Magazzino', 'type' => 'text', 'placeholder' => 'WH-01'],
        ],
        'SUGGERISCI_RELATI' => [
            ['name' => 'tipo', 'label' => 'Tipo relazione', 'type' => 'select', 'options' => ['UPSELL','CROSS_SELL','SERVIZIO_AUSILIARIO','SOSTITUTIVO','ADD_ON']],
            ['name' => 'max', 'label' => 'Max suggerimenti', 'type' => 'number', 'placeholder' => '5'],
        ],
        'GENERA_DOCUMENTO' => [
            ['name' => 'tipo_documento', 'label' => 'Tipo documento', 'type' => 'select', 'options' => ['FATTURA','DDT','CONTRATTO']],
            ['name' => 'serie', 'label' => 'Serie', 'type' => 'text', 'placeholder' => 'A'],
            ['name' => 'invia_email', 'label' => 'Invia email', 'type' => 'select', 'options' => ['SI','NO']],
        ],
        'RICHIEDI_PAGAMENTO_DIGITALE' => [
            ['name' => 'gateway', 'label' => 'Gateway', 'type' => 'select', 'options' => ['STRIPE','PAYPAL']],
            ['name' => 'importo', 'label' => 'Importo', 'type' => 'number'],
            ['name' => 'descrizione', 'label' => 'Descrizione', 'type' => 'text'],
        ],
        'REGISTRA_PAGAMENTO' => [
            ['name' => 'documento_id', 'label' => 'Documento ID', 'type' => 'number'],
            ['name' => 'metodo', 'label' => 'Metodo', 'type' => 'select', 'options' => ['BONIFICO','CARTA','CONTANTI']],
            ['name' => 'importo', 'label' => 'Importo', 'type' => 'number'],
            ['name' => 'data', 'label' => 'Data', 'type' => 'date'],
        ],
        'CREA_TICKET' => [
            ['name' => 'categoria', 'label' => 'Categoria', 'type' => 'text'],
            ['name' => 'priorita', 'label' => 'Priorità', 'type' => 'select', 'options' => ['BASSA','MEDIA','ALTA']],
        ],
        'INVIA_SOLLECITO_EMAIL' => [
            ['name' => 'giorni_ritardo', 'label' => 'Giorni ritardo', 'type' => 'number', 'placeholder' => '5'],
            ['name' => 'destinatario', 'label' => 'Destinatario', 'type' => 'select', 'options' => ['CLIENTE','RESPONSABILE']],
            ['name' => 'messaggio', 'label' => 'Messaggio', 'type' => 'text'],
        ],
    ];
    $stmt = $pdo->prepare('UPDATE azioni_standard SET parametri_richiesti = :json WHERE codice = :cod AND (parametri_richiesti IS NULL OR parametri_richiesti = "")');
    foreach ($defs as $code => $arr) {
        $json = json_encode($arr, JSON_UNESCAPED_UNICODE);
        $stmt->execute([':json' => $json, ':cod' => $code]);
    }
} catch (Throwable $e) {
    fwrite(STDERR, "Avviso: update azioni_standard parametri fallito: " . $e->getMessage() . "\n");
}

echo "Completato.\n";

// Migrazione: aggiunge colonne latitudine/longitudine se mancanti
try {
    echo "Verifico colonne geografiche su clienti…\n";
    $res = $pdo->query("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clienti'")->fetchAll(PDO::FETCH_COLUMN, 0);
    $cols = array_map('strtolower', $res ?: []);
    if (!in_array('latitudine', $cols, true)) {
        echo "Aggiungo colonna latitudine…\n";
        $pdo->exec("ALTER TABLE clienti ADD COLUMN latitudine DECIMAL(10,6) NULL AFTER nazione");
    }
    if (!in_array('longitudine', $cols, true)) {
        echo "Aggiungo colonna longitudine…\n";
        $pdo->exec("ALTER TABLE clienti ADD COLUMN longitudine DECIMAL(10,6) NULL AFTER latitudine");
    }
} catch (Throwable $e) {
    fwrite(STDERR, "Errore migrazione geocoding clienti: " . $e->getMessage() . "\n");
}
