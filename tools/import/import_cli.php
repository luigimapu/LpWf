<?php
/**
 * Minimal ETL for legacy -> LpWF (ignoring workflow tables).
 * Usage:
 *  php tools/import/import_cli.php \
 *    --source-dsn="mysql:host=127.0.0.1;dbname=legacy;charset=utf8mb4" \
 *    --source-user=legacy_user --source-pass=secret \
 *    --target-dsn="mysql:host=127.0.0.1;dbname=tenant;charset=utf8mb4" \
 *    --target-user=tenant_user --target-pass=secret \
 *    --mapping=tools/import/mapping.json --entity=clienti --limit=100 --offset=0 --batch=500 --dry-run
 */

ini_set('display_errors', '1');
error_reporting(E_ALL & ~E_DEPRECATED);

function cli_getopt(): array {
    $long = [
        'source-dsn:', 'source-user:', 'source-pass:',
        'target-dsn:', 'target-user:', 'target-pass:',
        'mapping:', 'entity:', 'limit::', 'offset::', 'batch::', 'dry-run::'
    ];
    $opt = getopt('', $long);
    return $opt ?: [];
}

function pdo_connect(string $dsn, ?string $user, ?string $pass): PDO {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    // enforce utf8mb4 if possible
    try { $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"); } catch (Throwable $e) {}
    return $pdo;
}

function load_mapping(string $path): array {
    if (!file_exists($path)) throw new RuntimeException("Mapping not found: $path");
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $raw = file_get_contents($path);
    if ($ext === 'json') {
        $cfg = json_decode($raw, true);
        if (!is_array($cfg)) throw new RuntimeException("Invalid JSON mapping");
        return $cfg;
    }
    // Basic YAML to array (very limited) – suggest using JSON
    throw new RuntimeException("Only JSON mapping is supported in this build. Provide mapping.json");
}

// ------- transforms -------
function string_trim($v) { return is_null($v) ? null : trim((string)$v); }
function int_or_null($v) { return ($v === '' || $v === null) ? null : (int)$v; }
function float_or_zero($v) { return ($v === '' || $v === null) ? 0.0 : (float)$v; }
function email_normalize($v) {
    $v = trim((string)$v);
    if ($v === '') return null;
    $v = strtolower($v);
    return filter_var($v, FILTER_VALIDATE_EMAIL) ? $v : $v; // keep as-is if not strictly valid
}
function vat_normalize($v) {
    $v = preg_replace('/\s+/', '', (string)$v);
    $v = strtoupper($v);
    return $v === '' ? null : $v;
}
function map_tipo_cliente($v) {
    $v = strtoupper(trim((string)$v));
    $map = [ 'AZIENDA' => 'AZIENDA', 'PRIVATO' => 'PRIVATO', 'PA' => 'PA' ];
    return $map[$v] ?? 'AZIENDA';
}
function map_forma_to_tipo($v) {
    // Map legacy 'formagiuridica' to tipo_cliente
    $v = strtoupper(trim((string)$v));
    if ($v === '') return 'AZIENDA';
    if (strpos($v, 'PA') !== false || strpos($v, 'PUBBLICA AMMINISTRAZIONE') !== false) return 'PA';
    if (strpos($v, 'SRL') !== false || strpos($v, 'SPA') !== false || strpos($v, 'SAS') !== false || strpos($v, 'SNC') !== false || strpos($v, 'COOP') !== false || strpos($v, 'ASSOC') !== false) return 'AZIENDA';
    // Heuristics: if seems a person, treat as PRIVATO
    if (strpos($v, 'DITTA') !== false || strpos($v, 'INDIVIDUALE') !== false) return 'AZIENDA';
    return 'PRIVATO';
}
function date_ymd($v) {
    if (!$v) return null;
    $ts = strtotime((string)$v);
    if ($ts === false) return null;
    return date('Y-m-d', $ts);
}
function date_ymd_or_null($v) { $d = date_ymd($v); return $d ?: null; }
function map_doc_stato($v) {
    // Legacy approved flag -> textual state
    $i = (int)$v; return $i ? 'APPROVATO' : 'DA_VERIFICARE';
}
function map_pag_stato($v) {
    $i = (int)$v; return $i ? 'ESEGUITO' : 'PENDENTE';
}

function cap_normalize($v) {
    $s = preg_replace('/\D+/', '', (string)$v);
    if ($s === '') return null;
    // Italian CAP are 5 digits; keep first 5 if longer
    if (strlen($s) > 5) $s = substr($s, 0, 5);
    // left-pad not needed; keep as-is
    return $s;
}

function provincia_normalize($v) {
    $s = strtoupper(trim((string)$v));
    if ($s === '') return null;
    // If already two letters, keep
    if (preg_match('/^[A-Z]{2}$/', $s)) return $s;
    // If looks like a city/province name, derive 2-letter code heuristically
    // Take first two alphabetic characters
    $letters = preg_replace('/[^A-Z]/', '', $s);
    if (strlen($letters) >= 2) return substr($letters, 0, 2);
    return $s;
}

function phone_normalize($v) {
    $s = trim((string)$v);
    if ($s === '') return null;
    // keep leading + if present, and digits
    $leadPlus = substr($s, 0, 1) === '+';
    $digits = preg_replace('/\D+/', '', $s);
    if ($digits === '') return null;
    return ($leadPlus ? '+' : '') . $digits;
}

function apply_transform(?string $fn, $value) {
    if (!$fn) return $value;
    if (!function_exists($fn)) throw new RuntimeException("Unknown transform: $fn");
    return $fn($value);
}

function ensure_non_workflow_table(string $name): void {
    if (preg_match('/(^|_)workflow/i', $name)) {
        throw new RuntimeException("Workflow tables are ignored by policy: $name");
    }
}

function resolve_field(array $row, string $sourceExpr) {
    // sourceExpr like "table.column" or just "column"
    $parts = explode('.', $sourceExpr);
    $col = end($parts);
    // case-insensitive lookup
    foreach ($row as $k => $v) {
        if (strcasecmp($k, $col) === 0) return $v;
    }
    return null;
}

function build_upsert_sql(string $table, array $payload, ?array $matchOn = null): array {
    $cols = array_keys($payload);
    $place = array_fill(0, count($cols), '?');
    $insert = "INSERT INTO `$table` (" . implode(',', array_map(fn($c)=>"`$c`", $cols)) . ") VALUES (" . implode(',', $place) . ")";
    if ($matchOn && count($matchOn) > 0) {
        // ON DUPLICATE KEY UPDATE requires a unique index; if not available, we will try a manual MATCH/UPDATE later.
        $updates = implode(',', array_map(fn($c)=>"`$c`=VALUES(`$c`)", $cols));
        return [ $insert . " ON DUPLICATE KEY UPDATE " . $updates, array_values($payload) ];
    }
    return [ $insert, array_values($payload) ];
}

// -------- main --------
$opt = cli_getopt();
foreach (['source-dsn','target-dsn','mapping','entity'] as $req) {
    if (!isset($opt[$req])) {
        fwrite(STDERR, "Missing --$req\n");
        exit(1);
    }
}

$src = pdo_connect($opt['source-dsn'], $opt['source-user'] ?? null, $opt['source-pass'] ?? null);
$tgt = pdo_connect($opt['target-dsn'], $opt['target-user'] ?? null, $opt['target-pass'] ?? null);
$cfg = load_mapping($opt['mapping']);
$entityName = $opt['entity'];
$limit = isset($opt['limit']) ? (int)$opt['limit'] : 0;
$offset = isset($opt['offset']) ? (int)$opt['offset'] : 0;
$batch = isset($opt['batch']) ? max(1, (int)$opt['batch']) : 500;
$dryRun = array_key_exists('dry-run', $opt);

$entity = null;
foreach (($cfg['entities'] ?? []) as $e) {
    if (($e['name'] ?? '') === $entityName) { $entity = $e; break; }
}
if (!$entity) { throw new RuntimeException("Entity not found in mapping: $entityName"); }

$srcTable = $entity['source']['table'] ?? '';
$tgtTable = $entity['target']['table'] ?? '';
ensure_non_workflow_table($srcTable);
ensure_non_workflow_table($tgtTable);

// Build SELECT
$where = $entity['source']['where'] ?? null;
$sql = "SELECT * FROM `$srcTable`" . ($where ? (" WHERE $where") : "");
if ($limit > 0) { $sql .= " LIMIT $offset,$limit"; }

fwrite(STDERR, "Reading from $srcTable → $tgtTable" . ($dryRun ? " [DRY-RUN]" : "") . "\n");

$stmt = $src->query($sql);
$count = 0; $applied = 0; $skipped = 0;
$rows = [];
while ($row = $stmt->fetch()) {
    $rows[] = $row;
    if (count($rows) >= $batch) {
        [$ok,$skip] = process_batch($rows, $entity, $tgt, $dryRun);
        $applied += $ok; $skipped += $skip; $count += count($rows); $rows = [];
        fwrite(STDERR, ".");
    }
}
if ($rows) {
    [$ok,$skip] = process_batch($rows, $entity, $tgt, $dryRun);
    $applied += $ok; $skipped += $skip; $count += count($rows);
}
fwrite(STDERR, "\nDone. Read=$count, Applied=$applied, Skipped=$skipped\n");

function process_batch(array $rows, array $entity, PDO $tgt, bool $dryRun): array {
    $ok=0; $skip=0;
    $tgtTable = $entity['target']['table'];
    $matchOn = $entity['target']['match_on'] ?? null;
    foreach ($rows as $row) {
        try {
            $payload = [];
            foreach ($entity['fields'] as $fm) {
                $val = resolve_field($row, $fm['source']);
                $val = apply_transform($fm['transform'] ?? null, $val);
                $payload[$fm['target']] = $val;
            }
            if ($dryRun) { $ok++; continue; }
            // try upsert
            [$sql,$params] = build_upsert_sql($tgtTable, $payload, $matchOn);
            try {
                $st = $tgt->prepare($sql);
                $st->execute($params);
                $ok++;
            } catch (PDOException $e) {
                // fallback: try match_on -> update
                if ($matchOn && count($matchOn) > 0) {
                    $where = [];$wparams=[];
                    foreach ($matchOn as $f) { $where[] = "`$f`=?"; $wparams[] = $payload[$f] ?? null; }
                    $upd = [];$uparams=[];
                    foreach ($payload as $k=>$v){ $upd[] = "`$k`=?"; $uparams[] = $v; }
                    $sql2 = "UPDATE `$tgtTable` SET ".implode(',', $upd)." WHERE ".implode(' AND ', $where);
                    $st2 = $tgt->prepare($sql2);
                    $st2->execute(array_merge($uparams,$wparams));
                    $ok++;
                } else {
                    throw $e;
                }
            }
        } catch (Throwable $e) {
            $skip++;
        }
    }
    return [$ok,$skip];
}
