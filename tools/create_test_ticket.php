<?php
require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Ticket.php';

// Carica env
$env = __DIR__ . '/../.env';
if (file_exists($env)) { loadEnv($env, true); }

try {
    $db = new Database();
} catch (Throwable $e) {
    fwrite(STDERR, "Connessione DB fallita: " . $e->getMessage() . "\n");
    exit(2);
}

// Risolvi utente creatore (admin se presente, altrimenti primo utente)
$creator = $db->selectOne("SELECT id FROM utenti WHERE UPPER(ruolo) = 'ADMIN' ORDER BY id LIMIT 1");
if (!$creator) { $creator = $db->selectOne("SELECT id FROM utenti ORDER BY id LIMIT 1"); }
if (!$creator) {
    fwrite(STDERR, "Nessun utente presente per impostare creato_da.\n");
    exit(3);
}
$creatorId = (int)$creator['id'];

$t = new Ticket($db);
$t->titolo = 'Ticket di prova – ' . date('Y-m-d H:i');
$t->descrizione = 'Creato automaticamente per test allegati e flusso.';
$t->priorita = 'MEDIA';
$t->stato = 'APERTO';
$t->creato_da = $creatorId;

if ($t->create()) {
    echo json_encode(['ok' => true, 'id' => (int)$t->id, 'message' => 'Ticket creato'], JSON_UNESCAPED_UNICODE) . "\n";
    exit(0);
}

fwrite(STDERR, "Errore creazione ticket.\n");
exit(5);

