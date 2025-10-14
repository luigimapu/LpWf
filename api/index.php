<?php
require_once __DIR__ . '/../config/env_loader.php';
loadEnv(__DIR__ . '/../.env');

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Content-Language: it-IT');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Max-Age: 3600');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Evita che warning/notices vadano in output rompendo il JSON delle API
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL & ~E_DEPRECATED);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/CrudBaseAbstract.php';
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Utente.php';
require_once __DIR__ . '/../models/Workflow.php';
require_once __DIR__ . '/../models/WorkflowStep.php';
require_once __DIR__ . '/../models/WorkflowIstanza.php';
require_once __DIR__ . '/../models/AzioneStandard.php';
require_once __DIR__ . '/../models/Gruppo.php';
require_once __DIR__ . '/../models/UtenteGruppo.php';
require_once __DIR__ . '/../models/TaskNota.php';
require_once __DIR__ . '/ApiController.php';
require_once __DIR__ . '/AuthController.php';
require_once __DIR__ . '/EnrichmentController.php';
require_once __DIR__ . '/CatalogMediaController.php';
require_once __DIR__ . '/CatalogController.php';
require_once __DIR__ . '/CatalogVariantsController.php';
require_once __DIR__ . '/CatalogPricesController.php';
require_once __DIR__ . '/CatalogArticleCategoriesController.php';
require_once __DIR__ . '/CatalogRelationsController.php';
require_once __DIR__ . '/CatalogListsController.php';
require_once __DIR__ . '/ServiceController.php';
require_once __DIR__ . '/CatalogCategoriesController.php';
require_once __DIR__ . '/HubTenantsController.php';
require_once __DIR__ . '/../services/AuthService.php';

function sendJson(int $status, array $payload): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
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

$uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$uri_segments = explode('/', $uri);

$api_index = array_search('api', $uri_segments);
if ($api_index === false) {
    sendJson(400, ['message' => 'Endpoint API non valido.']);
    exit();
}

$request_parts = array_slice($uri_segments, $api_index + 1);

$resource_name = $request_parts[0] ?? null;
$id = null;
$action = null;
$extra_id = null;

// Parsing flessibile: supporta
// - /api/{resource}/{id}
// - /api/{resource}/{id}/{action}
// - /api/{resource}/{action}
if (isset($request_parts[1])) {
    if (is_numeric($request_parts[1])) {
        $id = (int)$request_parts[1];
        $action = $request_parts[2] ?? null;
        if (isset($request_parts[3]) && is_numeric($request_parts[3])) {
            $extra_id = (int)$request_parts[3];
        }
    } else {
        // Se il secondo segmento non è numerico, trattalo come action
        $action = $request_parts[1];
        // Eventuale terzo segmento numerico come id
        if (isset($request_parts[2]) && is_numeric($request_parts[2])) {
            $id = (int)$request_parts[2];
        }
        // Eventuale quarto segmento numerico come extra_id
        if (isset($request_parts[3]) && is_numeric($request_parts[3])) {
            $extra_id = (int)$request_parts[3];
        }
    }
}

if (!$resource_name) {
    sendJson(400, ['message' => 'Nessuna risorsa specificata.']);
    exit();
}

$database = new Database();
$request_method = $_SERVER['REQUEST_METHOD'];
$authService = new AuthService($database);

if ($resource_name === 'auth') {
    $authController = new AuthController($authService);

    if ($action === 'login' || ($action === null && $request_method === 'POST')) {
        $authController->handle($request_method, $action);
        exit();
    }

    $headers = getRequestHeaders();
    $authorizationHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    try {
        $currentUser = $authService->authenticateRequest($authorizationHeader);
        $_SERVER['AUTH_USER'] = $currentUser;
        $authController->setCurrentUser($currentUser);
    } catch (AuthException $ex) {
        sendJson(401, ['message' => $ex->getMessage()]);
        exit();
    } catch (Throwable $ex) {
        sendJson(500, ['message' => 'Errore nella verifica dell\'autenticazione.']);
        exit();
    }

    $authController->handle($request_method, $action);
    exit();
}

// Health: endpoint pubblico per diagnostica (no auth obbligatoria)
if ($resource_name === 'health') {
    $headers = getRequestHeaders();
    $authorizationHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    $auth_ok = false;
    $auth_user = null;
    if ($authorizationHeader) {
        try {
            $auth_user = $authService->authenticateRequest($authorizationHeader);
            $auth_ok = true;
        } catch (Throwable $e) {
            $auth_ok = false;
        }
    }
    $db_ok = true;
    $tables = ['auth_audit' => false, 'user_role_audit' => false];
    $counts = ['auth_audit' => null, 'user_role_audit' => null];
    try {
        $rows = $database->select("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('auth_audit','user_role_audit')");
        $present = array_map(fn($r) => $r['table_name'] ?? '', $rows ?: []);
        foreach ($tables as $name => $_) { $tables[$name] = in_array($name, $present, true); }
        foreach ($tables as $name => $exists) {
            if ($exists) {
                $c = $database->selectOne("SELECT COUNT(*) AS c FROM `$name`");
                $counts[$name] = $c !== false ? (int)($c['c'] ?? 0) : null;
            }
        }
    } catch (Throwable $e) { $db_ok = false; }
    sendJson(200, [
        'db_ok' => $db_ok,
        'tables' => $tables,
        'counts' => $counts,
        'auth_ok' => $auth_ok,
        'auth_user' => $auth_user,
    ]);
    exit();
}

// Tenant health: verifica tabelle chiave del DB tenant (no auth obbligatoria)
if ($resource_name === 'tenant_health') {
    $db_ok = true;
    $tables = [
        'utenti' => false,
        'clienti' => false,
        'gruppi' => false,
        'workflow_modelli' => false,
        'workflow_passi' => false,
        'workflow_istanze' => false,
        'workflow_task' => false,
        'documenti' => false,
    ];
    $counts = [];
    $clientiColumns = ['latitudine' => false, 'longitudine' => false];
    try {
        $rows = $database->select("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()");
        $present = array_map(fn($r) => $r['table_name'] ?? '', $rows ?: []);
        foreach ($tables as $name => $_) {
            $exists = in_array($name, $present, true);
            $tables[$name] = $exists;
            if ($exists) {
                $c = $database->selectOne("SELECT COUNT(*) AS c FROM `$name`");
                $counts[$name] = $c !== false ? (int)($c['c'] ?? 0) : null;
            } else {
                $counts[$name] = null;
            }
        }
        // Se la tabella clienti esiste, verifica colonne latitudine/longitudine
        if (!empty($tables['clienti'])) {
            $cols = $database->select("SELECT LOWER(COLUMN_NAME) AS col FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clienti' AND LOWER(COLUMN_NAME) IN ('latitudine','longitudine')");
            $set = array_map(fn($r) => $r['col'] ?? '', $cols ?: []);
            $clientiColumns['latitudine'] = in_array('latitudine', $set, true);
            $clientiColumns['longitudine'] = in_array('longitudine', $set, true);
        }
    } catch (Throwable $e) { $db_ok = false; }
    sendJson(200, [
        'db_ok' => $db_ok,
        'tables' => $tables,
        'counts' => $counts,
        'clienti_columns' => $clientiColumns,
    ]);
    exit();
}

$headers = getRequestHeaders();
$authorizationHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

try {
    $currentUser = $authService->authenticateRequest($authorizationHeader);
    $_SERVER['AUTH_USER'] = $currentUser;
} catch (AuthException $ex) {
    sendJson(401, ['message' => $ex->getMessage()]);
    exit();
} catch (Throwable $ex) {
    sendJson(500, ['message' => 'Errore nella verifica dell\'autenticazione.']);
    exit();
}

// Servizi integrazione (autenticati): /api/services/{azione}
if ($resource_name === 'services') {
    $svc = new ServiceController($database, $_SERVER['AUTH_USER'] ?? null);
    $svc->handle($request_method, $action);
    exit();
}

// Enrichment (autenticato): servizi di suggerimento media/descrizioni
if ($resource_name === 'enrichment') {
    try {
        $currentUser = $authService->authenticateRequest($authorizationHeader);
        $_SERVER['AUTH_USER'] = $currentUser;
    } catch (Throwable $ex) {
        sendJson(401, ['message' => 'Non autenticato']);
        exit();
    }
    $controller = new EnrichmentController();
    $action = $action ?? null;
    $controller->handle($request_method, $action);
    exit();
}

// Catalog media (autenticato): attach/remove media per articoli del hub catalogo
if ($resource_name === 'catalog_media') {
    try {
        $currentUser = $authService->authenticateRequest($authorizationHeader);
        $_SERVER['AUTH_USER'] = $currentUser;
        // Permessi minimi: USER autenticato
    } catch (Throwable $ex) {
        sendJson(401, ['message' => 'Non autenticato']);
        exit();
    }
    $controller = new CatalogMediaController();
    $controller->handle($request_method, $id, $action);
    exit();
}

// Hub Tenants (autenticato): gestione tenants su Hub (solo Admin)
if ($resource_name === 'hub_tenants') {
    try {
        $currentUser = $authService->authenticateRequest($authorizationHeader);
        $_SERVER['AUTH_USER'] = $currentUser;
    } catch (Throwable $ex) {
        sendJson(401, ['message' => 'Non autenticato']);
        exit();
    }
    try { $ctrl = new HubTenantsController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione HubTenantsController']); }
    exit();
}

// Catalogo art icoli (hub DB) – scrittura semplice (autenticata)
if ($resource_name === 'catalogo_articoli') {
    try { $currentUser = $authService->authenticateRequest($authorizationHeader); $_SERVER['AUTH_USER'] = $currentUser; } catch (Throwable $ex) { sendJson(401, ['message' => 'Non autenticato']); exit(); }
    try {
        $catalog = new CatalogController();
        $catalog->handle($request_method, $id);
    } catch (Throwable $e) {
        sendJson(500, ['message' => 'Errore inizializzazione CatalogController']);
    }
    exit();
}

if ($resource_name === 'catalogo_varianti') {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogVariantsController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogVariantsController']); }
    exit();
}

if ($resource_name === 'catalogo_prezzi') {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogPricesController(); $ctrl->handle($request_method); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogPricesController']); }
    exit();
}

if ($resource_name === 'catalogo_articoli_categorie' && $id) {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogArticleCategoriesController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogArticleCategoriesController']); }
    exit();
}

if ($resource_name === 'catalogo_relazioni') {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogRelationsController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogRelationsController']); }
    exit();
}

if ($resource_name === 'catalogo_listini') {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogListsController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogListsController']); }
    exit();
}

if ($resource_name === 'catalogo_categorie') {
    try { $authService->authenticateRequest($authorizationHeader); } catch (Throwable $ex) { sendJson(401, ['message'=>'Non autenticato']); exit(); }
    try { $ctrl = new CatalogCategoriesController(); $ctrl->handle($request_method, $id); }
    catch (Throwable $e) { sendJson(500, ['message'=>'Errore inizializzazione CatalogCategoriesController']); }
    exit();
}

// Config runtime: restituisce configurazione pubblica (autenticata)
if ($resource_name === 'config') {
    $cfg = [
        'audit_role_limit' => (int)(getenv('AUDIT_ROLE_LIMIT') ?: 200),
        'audit_auth_default_limit' => (int)(getenv('AUDIT_AUTH_DEFAULT_LIMIT') ?: 200),
        'gmaps_embed_key' => getenv('GOOGLE_MAPS_EMBED_API_KEY') ?: null,
    ];
    sendJson(200, $cfg);
    exit();
}

$controller = new ApiController($database, $request_method);
$controller->processRequest($resource_name, $id, $action, $extra_id);
