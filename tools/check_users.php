<?php
require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';

// Carica variabili da .env
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    loadEnv($envPath, false);
}

$db = new Database();

$out = [
    'db' => getenv('DB_NAME') ?: null,
    'host' => getenv('DB_HOST') ?: null,
    'users' => [ 'count' => 0, 'sample' => [] ],
];

// Conta utenti totali e attivi
$row = $db->selectOne("SELECT COUNT(*) AS cnt FROM utenti");
$out['users']['count'] = (int)($row['cnt'] ?? 0);

// Piccolo sample (max 5) per conferma
$sample = $db->select("SELECT id, nome, cognome, email, ruolo, stato FROM utenti ORDER BY id DESC LIMIT 5");
$out['users']['sample'] = $sample ?: [];

header('Content-Type: application/json');
echo json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
