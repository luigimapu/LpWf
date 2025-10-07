<?php
require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/HubDatabase.php';

// Carica .env se presente
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Solo metodi GET supportati (read-only)
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respondJson(405, ['errore' => ['codice' => 'METHOD_NOT_ALLOWED', 'messaggio' => 'Metodo non consentito']]);
}

// Routing minimale: /hub_catalogo/{risorsa}/[id]
// Calcolo segmenti da URL o da ?path=
$segments = [];
do {
    // 1) Proviamo da PATH_INFO
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    if ($pathInfo) {
        $segments = array_values(array_filter(explode('/', trim($pathInfo, '/'))));
        break;
    }
    // 2) Dalla REQUEST_URI rispetto alla cartella dello script
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    $relativePath = ltrim(substr($path, strlen($scriptDir)), '/');
    $segments = array_values(array_filter(explode('/', $relativePath)));
    if (!empty($segments) && $segments[0] === basename($_SERVER['SCRIPT_NAME'])) {
        array_shift($segments);
    }
    if ($segments) break;
    // 3) Fallback: parametro query ?path=articoli/123
    if (!empty($_GET['path'])) {
        $segments = array_values(array_filter(explode('/', trim((string)$_GET['path'], '/'))));
    }
} while (false);

if (!$segments) {
    respondJson(404, ['errore' => ['codice' => 'ENDPOINT_NOT_FOUND', 'messaggio' => 'Endpoint non trovato']]);
}

$resource = strtolower($segments[0]);
$id = null;
if (isset($segments[1]) && ctype_digit($segments[1])) {
    $id = (int)$segments[1];
}

try {
    $db = new HubDatabase();
} catch (Throwable $e) {
    $msg = $e->getMessage();
    // Non esporre credenziali in chiaro, ma mostra un indizio utile in sviluppo
    if (stripos($msg, 'incompleta') !== false) {
        $msg = 'Configurazione HUB_DB_* mancante o incompleta nel file .env';
    }
    respondJson(500, ['errore' => ['codice' => 'DB_ERROR', 'messaggio' => $msg]]);
}

switch ($resource) {
    case 'articoli':
        try {
            if ($id) {
                $detail = getArticoloDettaglio($db, $id, $_GET);
                if (!$detail) {
                    respondJson(404, ['errore' => ['codice' => 'NOT_FOUND', 'messaggio' => 'Articolo non trovato']]);
                }
                respondJson(200, $detail);
            } else {
                $list = getArticoli($db, $_GET);
                respondJson(200, $list);
            }
        } catch (Throwable $e) {
            respondJson(500, ['errore' => ['codice' => 'QUERY_ERROR', 'messaggio' => 'Errore durante la lettura articoli']]);
        }
        break;
    case 'categorie':
        try {
            $rows = $db->select('SELECT id, nome, slug FROM categorie ORDER BY nome');
            respondJson(200, $rows ?: []);
        } catch (Throwable $e) {
            respondJson(500, ['errore' => ['codice' => 'QUERY_ERROR', 'messaggio' => 'Errore durante la lettura categorie']]);
        }
        break;
    case 'tenants':
        try {
            $rows = $db->select('SELECT id, slug, ragione_sociale FROM tenants ORDER BY ragione_sociale');
            respondJson(200, $rows ?: []);
        } catch (Throwable $e) {
            respondJson(500, ['errore' => ['codice' => 'QUERY_ERROR', 'messaggio' => 'Errore durante la lettura tenants']]);
        }
        break;
    default:
        respondJson(404, ['errore' => ['codice' => 'RESOURCE_NOT_SUPPORTED', 'messaggio' => 'Risorsa non supportata']]);
}

function respondJson(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function getArticoliColumnsPresence(HubDatabase $db): array
{
    try {
        $rows = $db->select("SELECT LOWER(COLUMN_NAME) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'articoli' AND LOWER(COLUMN_NAME) IN ('codice_tenant','marca','modello','versione')");
        $present = array_map(fn($r) => $r['c'] ?? '', $rows ?: []);
        $set = array_flip($present);
        return [
            'codice_tenant' => isset($set['codice_tenant']),
            'marca' => isset($set['marca']),
            'modello' => isset($set['modello']),
            'versione' => isset($set['versione']),
        ];
    } catch (Throwable $e) {
        return [ 'codice_tenant' => false, 'marca' => false, 'modello' => false, 'versione' => false ];
    }
}

function getArticoli(HubDatabase $db, array $query = []): array
{
    $params = [];
    $where = ["a.stato_pubblicazione = 'PUBBLICATO'", 'a.deleted_il IS NULL'];

    if (!empty($query['tipologia'])) {
        // Mappa eventuale alias "PRODOTTO" -> "FISICO"
        $tip = strtoupper(trim((string)$query['tipologia']));
        if ($tip === 'PRODOTTO') { $tip = 'FISICO'; }
        $where[] = 'a.tipologia = ?';
        $params[] = $tip;
    }
    if (!empty($query['q'])) {
        $q = '%' . str_replace(['%','_'], ['\\%','\\_'], (string)$query['q']) . '%';
        $where[] = '(a.titolo LIKE ? OR a.sottotitolo LIKE ? OR a.descrizione LIKE ? OR a.sku_globale LIKE ?)';
        array_push($params, $q, $q, $q, $q);
    }

    // Filtro visibilità opzionale
    if (!empty($query['visibilita'])) {
        $where[] = 'a.visibilita = ?';
        $params[] = strtoupper(trim((string)$query['visibilita']));
    }

    // Filtro categoria (slug)
    $categoryJoin = '';
    if (!empty($query['categoria'])) {
        $categoryJoin = ' JOIN articoli_categorie ac2 ON ac2.articolo_id = a.id JOIN categorie c2 ON c2.id = ac2.categoria_id ';
        $where[] = 'c2.slug = ?';
        $params[] = trim((string)$query['categoria']);
    }

    // Filtro tenant (slug o id numerico). Manteniamo sempre una LEFT JOIN a tenants
    // così possiamo selezionare t.slug anche senza filtro esplicito.
    $tenantJoin = ' LEFT JOIN tenants t ON t.id = a.tenant_id ';
    if (!empty($query['tenant'])) {
        $tenant = trim((string)$query['tenant']);
        if (ctype_digit($tenant)) {
            $where[] = 'a.tenant_id = ?';
            $params[] = (int)$tenant;
        } else {
            $where[] = 't.slug = ?';
            $params[] = $tenant;
        }
    }

    $limit = isset($query['limite']) && ctype_digit((string)$query['limite']) ? (int)$query['limite'] : 50;
    if ($limit < 1) $limit = 50; if ($limit > 200) $limit = 200;
    $page = isset($query['pagina']) && ctype_digit((string)$query['pagina']) ? (int)$query['pagina'] : 1;
    if ($page < 1) $page = 1;
    $offset = ($page - 1) * $limit;

    $cols = getArticoliColumnsPresence($db);
    $selCodice = $cols['codice_tenant'] ? 'a.codice_tenant' : 'NULL';
    $selMarca = $cols['marca'] ? 'a.marca' : 'NULL';
    $selModello = $cols['modello'] ? 'a.modello' : 'NULL';
    $selVersione = $cols['versione'] ? 'a.versione' : 'NULL';

    $sql = "SELECT a.id, a.sku_globale AS sku, $selCodice AS codice_tenant, $selMarca AS marca, $selModello AS modello, $selVersione AS versione, a.tipologia, a.titolo, a.sottotitolo, a.visibilita,
                   MIN(p.prezzo) AS prezzo_min, MAX(p.prezzo) AS prezzo_max,
                   GROUP_CONCAT(DISTINCT c.nome ORDER BY c.nome SEPARATOR ', ') AS categorie,
                   t.slug AS tenant_slug
            FROM articoli a
            LEFT JOIN articoli_varianti v ON v.articolo_id = a.id
            LEFT JOIN prezzi_articoli p ON p.variante_id = v.id
            LEFT JOIN articoli_categorie ac ON ac.articolo_id = a.id
            LEFT JOIN categorie c ON c.id = ac.categoria_id
            $tenantJoin
            $categoryJoin
            WHERE " . implode(' AND ', $where) . "
            GROUP BY a.id
            ORDER BY a.aggiornato_il DESC
            LIMIT $limit OFFSET $offset";

    $rows = $db->select($sql, $params);
    return is_array($rows) ? $rows : [];
}

function getArticoloDettaglio(HubDatabase $db, int $id, array $query = []): ?array
{
    $cols = getArticoliColumnsPresence($db);
    $selCodice = $cols['codice_tenant'] ? 'codice_tenant' : 'NULL AS codice_tenant';
    $selMarca = $cols['marca'] ? 'marca' : 'NULL AS marca';
    $selModello = $cols['modello'] ? 'modello' : 'NULL AS modello';
    $selVersione = $cols['versione'] ? 'versione' : 'NULL AS versione';

    $a = $db->selectOne("SELECT id, tenant_id, sku_globale AS sku, $selCodice, $selMarca, $selModello, $selVersione, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, set_attributi_id FROM articoli WHERE id = ? AND deleted_il IS NULL", [$id]);
    if (!$a) return null;

    // Varianti con prezzi min/max
    $varianti = $db->select("SELECT v.id, v.sku, v.nome,
                                     MIN(p.prezzo) AS prezzo_min, MAX(p.prezzo) AS prezzo_max
                              FROM articoli_varianti v
                              LEFT JOIN prezzi_articoli p ON p.variante_id = v.id
                              WHERE v.articolo_id = ? AND v.deleted_il IS NULL
                              GROUP BY v.id
                              ORDER BY v.nome", [$id]);

    // Disponibilità slot (solo se SERVIZIO): finestra temporale
    $dal = null; $al = null;
    if (!empty($query['dal'])) { $dal = date('Y-m-d H:i:s', strtotime($query['dal'])); }
    if (!empty($query['al'])) { $al = date('Y-m-d H:i:s', strtotime($query['al'])); }
    if (!$dal) { $dal = date('Y-m-d H:i:s'); }
    if (!$al) { $al = date('Y-m-d H:i:s', strtotime('+14 days')); }

    if (strtoupper($a['tipologia']) === 'SERVIZIO' && !empty($varianti)) {
        foreach ($varianti as &$v) {
            $slots = $db->select(
                "SELECT id, inizio, fine, capacita_totale, capacita_prenotata,
                        (capacita_totale - capacita_prenotata) AS capacita_disponibile
                 FROM disponibilita_slot
                 WHERE variante_id = ? AND fine >= ? AND inizio <= ?
                 ORDER BY inizio ASC
                 LIMIT 10",
                [$v['id'], $dal, $al]
            );
            $v['disponibilita'] = $slots ?: [];
        }
        unset($v);
    }

    // Categorie
    $categorie = $db->select("SELECT c.id, c.nome, c.slug FROM categorie c
                               JOIN articoli_categorie ac ON ac.categoria_id = c.id
                               WHERE ac.articolo_id = ?", [$id]);

    // Media (immagini/documenti) in ordine posizione
    $media = $db->select("SELECT id, tipologia, url, testo_alternativo, posizione FROM risorse_multimediali WHERE articolo_id = ? ORDER BY posizione ASC, id ASC", [$id]);

    // Relazioni
    $relazioni = $db->select("SELECT r.id, r.tipo_relazione, r.priorita, a2.id AS articolo_id, a2.titolo, a2.tipologia
                               FROM articoli_relazioni r
                               JOIN articoli a2 ON a2.id = r.articolo_correlato_id
                               WHERE r.articolo_sorgente_id = ?", [$id]);

    // Attributi a livello articolo (variante_id NULL)
    $attributi = $db->select("SELECT at.nome_tecnico, at.etichetta, va.valore_testo, va.valore_numero, va.valore_booleano
                               FROM valori_attributi va
                               JOIN attributi at ON at.id = va.attributo_id
                               WHERE va.articolo_id = ? AND va.variante_id IS NULL", [$id]);

    $a['varianti'] = $varianti ?: [];
    $a['categorie'] = $categorie ?: [];
    $a['media'] = $media ?: [];
    $a['relazioni'] = $relazioni ?: [];
    $a['attributi'] = $attributi ?: [];
    return $a;
}
