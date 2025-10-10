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
