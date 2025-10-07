<?php
// Setup/seed hub_catalogo database using env HUB_DB_*
// Usage: php tools/setup_hub_db.php

require_once __DIR__ . '/../config/env_loader.php';

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) { loadEnv($envFile, true); }

$host = getenv('HUB_DB_HOST') ?: 'localhost';
$dbName = getenv('HUB_DB_NAME') ?: 'hub_catalogo';
$user = getenv('HUB_DB_USER') ?: '';
$pass = getenv('HUB_DB_PASS') ?: '';

if ($user === '') {
    fwrite(STDERR, "HUB_DB_USER non configurato in .env\n");
    exit(1);
}

function runSql(PDO $pdo, string $sql): void {
    $delimiter = ';';
    $buffer = '';
    $inCommentBlock = false;
    $lines = preg_split("/\r?\n/", $sql);
    foreach ($lines as $rawLine) {
        $line = $rawLine;
        $trim = ltrim($line);
        if ($inCommentBlock) {
            if (str_contains($trim, '*/')) { $inCommentBlock = false; }
            continue;
        }
        if (str_starts_with($trim, '/*')) {
            if (!str_contains($trim, '*/')) { $inCommentBlock = true; }
            continue;
        }
        if ($trim === '' || str_starts_with($trim, '--') || str_starts_with($trim, '#')) {
            continue;
        }
        if (preg_match('/^DELIMITER\s+(.+)$/i', trim($line), $m)) {
            $delimiter = $m[1];
            continue;
        }
        $buffer .= $line . "\n";
        $cmp = rtrim($buffer);
        if ($delimiter !== '' && str_ends_with($cmp, $delimiter)) {
            $stmt = substr($cmp, 0, -strlen($delimiter));
            $stmt = trim($stmt);
            if ($stmt !== '') { $pdo->exec($stmt); }
            $buffer = '';
        }
    }
    $stmt = trim($buffer);
    if ($stmt !== '') { $pdo->exec($stmt); }
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

echo "Creazione database se mancante…\n";
$pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci");
$pdo->exec("USE `{$dbName}`");

$schemaPath = __DIR__ . '/../database/hub_schema.sql';
if (is_readable($schemaPath)) {
    echo "Eseguo schema: database/hub_schema.sql…\n";
    $sql = file_get_contents($schemaPath);
    runSql($pdo, $sql);
} else {
    echo "Schema mancante: {$schemaPath}\n";
}

$seedPath = __DIR__ . '/../database/hub_seed.sql';
if (is_readable($seedPath)) {
    echo "Eseguo seed: database/hub_seed.sql…\n";
    $sql = file_get_contents($seedPath);
    runSql($pdo, $sql);
} else {
    echo "Seed mancante: {$seedPath}\n";
}

echo "Completato.\n";

// Migrazioni: aggiunge colonna codice_tenant ad articoli se mancante
try {
    $cols = $pdo->query("SELECT LOWER(COLUMN_NAME) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'articoli'")->fetchAll(PDO::FETCH_COLUMN, 0);
    $cols = array_map('strtolower', $cols ?: []);
    if (!in_array('codice_tenant', $cols, true)) {
        echo "Aggiungo colonna articoli.codice_tenant…\n";
        $pdo->exec("ALTER TABLE articoli ADD COLUMN codice_tenant VARCHAR(190) NULL AFTER sku_globale");
        // Prova a creare unique su (tenant_id, codice_tenant); permette NULL multipli
        echo "Aggiungo indice univoco su (tenant_id, codice_tenant)…\n";
        $pdo->exec("ALTER TABLE articoli ADD UNIQUE KEY uq_articoli_codice_tenant (tenant_id, codice_tenant)");
    }
} catch (Throwable $e) {
    fwrite(STDERR, "Errore migrazione SKU codice_tenant: " . $e->getMessage() . "\n");
}

// Migrazioni: aggiunge colonne marca/modello/versione se mancanti
try {
    $cols = $pdo->query("SELECT LOWER(COLUMN_NAME) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'articoli'")->fetchAll(PDO::FETCH_COLUMN, 0);
    $cols = array_map('strtolower', $cols ?: []);
    if (!in_array('marca', $cols, true)) {
        echo "Aggiungo colonna articoli.marca…\n";
        $pdo->exec("ALTER TABLE articoli ADD COLUMN marca VARCHAR(150) NULL AFTER codice_tenant");
    }
    if (!in_array('modello', $cols, true)) {
        echo "Aggiungo colonna articoli.modello…\n";
        $pdo->exec("ALTER TABLE articoli ADD COLUMN modello VARCHAR(150) NULL AFTER marca");
    }
    if (!in_array('versione', $cols, true)) {
        echo "Aggiungo colonna articoli.versione…\n";
        $pdo->exec("ALTER TABLE articoli ADD COLUMN versione VARCHAR(150) NULL AFTER modello");
    }
} catch (Throwable $e) {
    fwrite(STDERR, "Errore migrazione marca/modello/versione: " . $e->getMessage() . "\n");
}
