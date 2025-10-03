<?php
// Cleanup demo instances created by seeding (entita_collegata_tipo='DEMO')
require_once __DIR__ . '/../config/env_loader.php';
loadEnv(__DIR__ . '/../.env');
require_once __DIR__ . '/../config/Database.php';

$db = new Database();

$dry = in_array('--dry', $argv) || in_array('-n', $argv);

$sql = "SELECT id FROM workflow_istanze WHERE entita_collegata_tipo = 'DEMO' ORDER BY id DESC";
$rows = $db->select($sql) ?: [];
if (empty($rows)) {
    echo "Nessuna istanza DEMO da eliminare.\n";
    exit(0);
}

echo "Trovate ".count($rows)." istanze DEMO.\n";

if ($dry) {
    echo "--dry attivo. Non verrà eliminato nulla.\n";
    foreach ($rows as $r) {
        echo "ID ".$r['id']."\n";
    }
    exit(0);
}

// Procediamo all'eliminazione: le FK cascaderanno sui task
$ids = array_map(fn($r) => (int)$r['id'], $rows);
$in = implode(',', array_fill(0, count($ids), '?'));
$deleted = $db->executeStatement("DELETE FROM workflow_istanze WHERE id IN ($in)", $ids);
echo "Eliminate $deleted istanze DEMO.\n";

