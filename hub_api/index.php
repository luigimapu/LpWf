<?php

require_once __DIR__ . '/../config/env_loader.php';

$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    loadEnv($envPath, true);
}

$sharedSecret = getenv('HUB_SHARED_SECRET') ?: 'changeme';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(405, ['errore' => ['codice' => 'METHOD_NOT_ALLOWED', 'messaggio' => 'Metodo non consentito']]);
}

$headers = getRequestHeaders();
$providedToken = null;
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
    $providedToken = $matches[1];
} elseif (isset($_GET['token'])) {
    $providedToken = $_GET['token'];
}

if ($providedToken === null) {
    respondJson(401, ['errore' => ['codice' => 'MISSING_TOKEN', 'messaggio' => 'Token mancante']]);
}

if ($providedToken !== $sharedSecret) {
    respondJson(403, ['errore' => ['codice' => 'INVALID_TOKEN', 'messaggio' => 'Token non valido']]);
}

$pathInfo = $_SERVER['PATH_INFO'] ?? '';
if ($pathInfo !== '') {
    $segments = array_values(array_filter(explode('/', trim($pathInfo, '/'))));
} else {
    $uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    $relativePath = ltrim(substr($uriPath, strlen($scriptDir)), '/');
    $segments = array_values(array_filter(explode('/', $relativePath)));

    if (!empty($segments) && $segments[0] === basename($_SERVER['SCRIPT_NAME'])) {
        array_shift($segments);
    }
}

if (empty($segments) && isset($_GET['path'])) {
    $segments = array_values(array_filter(explode('/', trim($_GET['path'], '/'))));
}

if (count($segments) < 2 || $segments[0] !== 'sync') {
    respondJson(404, ['errore' => ['codice' => 'ENDPOINT_NOT_FOUND', 'messaggio' => 'Endpoint non trovato']]);
}

$resource = $segments[1];
$entityMap = [
    'articoli' => 'ARTICOLO',
    'varianti' => 'VARIANTE',
    'relazioni' => 'RELAZIONE',
    'bundle' => 'BUNDLE',
    'scorte' => 'SCORTA',
    'prezzi' => 'PREZZO',
    'disponibilita' => 'DISPONIBILITA',
    'documenti' => 'DOCUMENTO',
    'generic' => 'ALTRO',
];

if (!isset($entityMap[$resource])) {
    respondJson(404, ['errore' => ['codice' => 'RESOURCE_NOT_SUPPORTED', 'messaggio' => 'Risorsa non supportata']]);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true);
if (!is_array($body)) {
    respondJson(400, ['errore' => ['codice' => 'INVALID_JSON', 'messaggio' => 'Payload JSON non valido']]);
}

$tenantId = $body['tenant_id'] ?? null;
if ($tenantId === null) {
    respondJson(400, ['errore' => ['codice' => 'TENANT_MISSING', 'messaggio' => 'tenant_id mancante']]);
}

$evento = strtoupper($body['evento'] ?? '');
$tipoEvento = mapEventType($evento) ?: defaultEventType($resource);
$entita = $entityMap[$resource];
$payload = $body['payload'] ?? $body;
$payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE);
$entitaId = extractEntityId($payload);

require_once __DIR__ . '/../config/HubDatabase.php';

$db = new HubDatabase();

$sql = 'INSERT INTO eventi_sync (tenant_id, entita, entita_id, tipo_evento, payload, stato_elaborazione) VALUES (?, ?, ?, ?, ?, ?)';
$db->executeStatement($sql, [$tenantId, $entita, $entitaId, $tipoEvento, $payloadJson, 'IN_ATTESA']);
$eventoId = (int) $db->lastInsertId();

respondJson(200, [
    'esito' => 'OK',
    'messaggi' => [],
    'dati' => [
        'id_evento' => $eventoId,
        'stato' => 'IN_ATTESA',
    ],
]);

function respondJson(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function getRequestHeaders(): array
{
    if (function_exists('getallheaders')) {
        return getallheaders();
    }

    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (str_starts_with($name, 'HTTP_')) {
            $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            $headers[$key] = $value;
        }
    }
    return $headers;
}

function mapEventType(string $evento): ?string
{
    if ($evento === '') {
        return null;
    }

    $parts = explode('_', $evento);
    $last = strtoupper(array_pop($parts));

    return match ($last) {
        'CREATE', 'CREA' => 'CREA',
        'UPDATE', 'AGGIORNA' => 'AGGIORNA',
        'DELETE', 'ELIMINA' => 'ELIMINA',
        'SET' => 'SET',
        default => 'SET',
    };
}

function defaultEventType(string $resource): string
{
    return match ($resource) {
        'articoli', 'varianti' => 'AGGIORNA',
        'relazioni', 'bundle', 'prezzi', 'disponibilita' => 'SET',
        'scorte' => 'AGGIORNA',
        'documenti' => 'CREA',
        default => 'SET',
    };
}

function extractEntityId(array $payload): ?string
{
    if (isset($payload['articolo'])) {
        return $payload['articolo']['id_centrale'] ?? $payload['articolo']['id_locale'] ?? null;
    }
    if (isset($payload['variante'])) {
        return $payload['variante']['id_centrale'] ?? $payload['variante']['id_locale'] ?? null;
    }
    if (isset($payload['id'])) {
        return (string)$payload['id'];
    }
    return null;
}
