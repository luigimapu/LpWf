<?php

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/HubDatabase.php';
require_once __DIR__ . '/../services/HubEventProcessor.php';

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

$limit = isset($argv[1]) ? max(1, (int)$argv[1]) : 50;

try {
    $db = new HubDatabase();
    $processor = new HubEventProcessor($db);
    $results = $processor->processPendingEvents($limit);

    if (empty($results)) {
        echo "Nessun evento da elaborare.\n";
        exit(0);
    }

    foreach ($results as $result) {
        $status = $result['successo'] ? 'OK' : 'KO';
        printf(
            "%s | ID:%d | %s | %s\n",
            $status,
            $result['id'],
            $result['entita'],
            $result['messaggio']
        );
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Errore processor: ' . $e->getMessage() . "\n");
    exit(1);
}

