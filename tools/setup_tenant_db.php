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
                $pdo->exec($stmt);
            }
            $buffer = '';
        }
    }
    // Execute remaining buffer if any
    $stmt = trim($buffer);
    if ($stmt !== '') {
        $pdo->exec($stmt);
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

$seedPath = __DIR__ . '/../database/tenant_seed.sql';
if (is_readable($seedPath)) {
    echo "Eseguo seed: database/tenant_seed.sql…\n";
    $sql = file_get_contents($seedPath);
    runSqlTenant($pdo, $sql);
} else {
    echo "Seed mancante: {$seedPath}\n";
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
