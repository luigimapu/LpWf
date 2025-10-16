<?php
require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';

$env = __DIR__ . '/../.env';
if (file_exists($env)) { loadEnv($env, true); }

try { $db = new Database(); } catch (Throwable $e) { fwrite(STDERR, "DB error\n"); exit(2); }

$ticketId = isset($argv[1]) ? (int)$argv[1] : 0;
if ($ticketId <= 0) {
    $row = $db->selectOne('SELECT id FROM tickets ORDER BY id DESC LIMIT 1');
    if (!$row) { fwrite(STDERR, "Nessun ticket.\n"); exit(3); }
    $ticketId = (int)$row['id'];
}

$user = $db->selectOne("SELECT id FROM utenti ORDER BY id LIMIT 1");
if (!$user) { fwrite(STDERR, "Nessun utente.\n"); exit(4); }
$uid = (int)$user['id'];

$msg = 'Commento di test allegato UI ' . date('c');
$ok = $db->executeStatement('INSERT INTO ticket_commenti (ticket_id, utente_id, messaggio, creato_il) VALUES (?, ?, ?, NOW())', [$ticketId, $uid, $msg]);
if ($ok === false) { fwrite(STDERR, "Errore insert commento.\n"); exit(5); }
$cid = (int)$db->lastInsertId();

// Allegato di test: collega file sentinella se esiste
$path = 'uploads/.write_test.txt';
if (is_file(__DIR__ . '/../' . $path)) {
    $db->executeStatement('INSERT INTO ticket_allegati (commento_id, nome_file_originale, percorso_file, creato_il) VALUES (?, ?, ?, NOW())', [$cid, 'write_test.txt', $path]);
}

echo json_encode(['ok' => true, 'ticket_id' => $ticketId, 'commento_id' => $cid, 'allegato' => is_file(__DIR__.'/../'.$path)], JSON_UNESCAPED_UNICODE) . "\n";
exit(0);

