<?php
require_once __DIR__ . '/../config/env_loader.php';
if (file_exists(__DIR__ . '/../.env')) { loadEnv(__DIR__ . '/../.env', true); }
require_once __DIR__ . '/../services/EnrichmentService.php';

$q = $argv[1] ?? 'crema';
$limit = isset($argv[2]) ? (int)$argv[2] : 5;

$svc = new EnrichmentService();
$items = $svc->searchMedia($q, $limit, 'it');
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n";
