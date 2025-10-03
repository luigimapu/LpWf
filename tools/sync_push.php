<?php

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/SyncService.php';

// Carica variabili ambiente dal file .env se presente
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

$database = new Database();
$syncService = new SyncService($database);

$limit = isset($argv[1]) ? (int)$argv[1] : 50;

try {
    $results = $syncService->pushPendingEvents($limit);
    if (empty($results)) {
        echo "Nessun evento da inviare.\n";
        exit(0);
    }

    foreach ($results as $result) {
        $status = $result['successo'] ? 'OK' : 'KO';
        printf(
            "%s | ID:%d | %s/%s | %s\n",
            $status,
            $result['id'],
            $result['entita'],
            $result['tipo_evento'],
            $result['messaggio']
        );
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Errore sincronizzazione: ' . $e->getMessage() . "\n");
    exit(1);
}

