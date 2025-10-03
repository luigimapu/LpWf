<?php

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/SyncQueueService.php';

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

$db = new Database();
$queue = new SyncQueueService($db);

$sku = $argv[1] ?? 'ART-DEMO-' . rand(100, 999);

$articolo = [
    'id_locale' => $sku,
    'sku_globale' => $sku,
    'titolo' => 'Articolo demo ' . $sku,
    'descrizione' => 'Creato dal demo_queue_article',
    'tipologia' => 'SERVIZIO',
    'stato_pubblicazione' => 'PUBBLICATO',
    'visibilita' => 'MARKETPLACE',
];

$eventId = $queue->queueArticolo($articolo);
printf("Evento articolo enqueued (#%d) per SKU %s\n", $eventId, $sku);

