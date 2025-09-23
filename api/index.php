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

ini_set('display_errors', 1);
error_reporting(E_ALL);

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

if (isset($request_parts[1]) && is_numeric($request_parts[1])) {
    $id = (int) $request_parts[1];
    $action = $request_parts[2] ?? null;

    if (isset($request_parts[3]) && is_numeric($request_parts[3])) {
        $extra_id = (int) $request_parts[3];
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

$controller = new ApiController($database, $request_method);
$controller->processRequest($resource_name, $id, $action, $extra_id);
