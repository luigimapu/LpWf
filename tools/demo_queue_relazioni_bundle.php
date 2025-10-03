<?php

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/SyncQueueService.php';

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

$skuSorgente = $argv[1] ?? 'ART-REL-001';
$skuCorrelato = $argv[2] ?? 'ART-REL-002';

$db = new Database();
$queue = new SyncQueueService($db);

$relazioni = [
    [
        'tipo' => 'SERVIZIO_AUSILIARIO',
        'articolo_correlato' => $skuCorrelato,
        'priorita' => 10,
    ],
    [
        'tipo' => 'UPSELL',
        'articolo_correlato' => $skuCorrelato,
        'priorita' => 5,
    ],
];

$relazioneId = $queue->queueRelazioni($skuSorgente, $relazioni, ['modalita' => 'REPLACE']);

echo sprintf("Relazioni accodate (evento #%d) per %s -> %s\n", $relazioneId, $skuSorgente, $skuCorrelato);

$bundle = [
    'strategia_prezzo' => 'FISSO',
    'prezzo_bundle' => 149.90,
];

$componenti = [
    [
        'articolo_component_sku' => $skuCorrelato,
        'quantita' => 1,
        'opzionale' => false,
        'preselezionato' => true,
    ],
];

$bundleId = $queue->queueBundle($skuSorgente, $bundle, $componenti, ['modalita_componenti' => 'REPLACE']);

echo sprintf("Bundle accodato (evento #%d) per %s con componente %s\n", $bundleId, $skuSorgente, $skuCorrelato);
