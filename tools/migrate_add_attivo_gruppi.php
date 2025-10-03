<?php
// Simple idempotent migration to add `attivo` to `gruppi` and backfill
// Usage:
//   php tools/migrate_add_attivo_gruppi.php            # live run
//   DRY_RUN=1 php tools/migrate_add_attivo_gruppi.php  # dry-run

require_once __DIR__ . '/../config/Database.php';

function println($msg) { echo $msg . PHP_EOL; }

$dryRun = getenv('DRY_RUN') === '1' || in_array('--dry-run', $argv ?? [], true);

$db = new Database();

// 1) Check if column exists
$checkSql = "SELECT COUNT(*) AS cnt
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'gruppi'
               AND COLUMN_NAME = 'attivo'";
$row = $db->selectOne($checkSql);
$exists = (int)($row['cnt'] ?? 0) > 0;

if ($exists) {
    println('[OK] Colonna `attivo` esiste già su `gruppi`. Nessuna azione necessaria.');
    exit(0);
}

$alterSql = "ALTER TABLE gruppi ADD COLUMN attivo TINYINT(1) NOT NULL DEFAULT 1 AFTER descrizione";

println('[..] Aggiungo colonna `attivo` a `gruppi` (DEFAULT 1)');
if ($dryRun) {
    println('[DRY-RUN] SQL: ' . $alterSql);
    exit(0);
}

$res = $db->executeStatement($alterSql);
if ($res === false) {
    println('[ERR] ALTER TABLE fallito.');
    exit(1);
}

// Backfill per sicurezza (alcune versioni non valorizzano retroattivamente)
$upd = $db->executeStatement("UPDATE gruppi SET attivo = 1 WHERE attivo IS NULL");
if ($upd === false) {
    println('[ERR] Backfill attivo fallito.');
    exit(1);
}

println('[OK] Colonna `attivo` creata e backfilled.');
exit(0);
