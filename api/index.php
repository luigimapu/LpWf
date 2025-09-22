<?php
require_once __DIR__ . '/../config/env_loader.php';
loadEnv(__DIR__ . '/../.env');

// Headers globali per CORS e JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Content-Language: it-IT");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestione della richiesta pre-flight CORS, fondamentale per i browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Includiamo i file di base e tutti i modelli che l'API potrebbe usare
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/ApiController.php';
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




// --- Parsing Robusto dell'URL ---
$uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$uri_segments = explode('/', $uri);

// Troviamo il segmento 'api' per rendere il path relativo
$api_index = array_search('api', $uri_segments);
if ($api_index === false) {
    http_response_code(400);
    echo json_encode(["message" => "Endpoint API non valido."]);
    exit();
}

// Estraiamo le parti rilevanti: risorsa, id, azione
$request_parts = array_slice($uri_segments, $api_index + 1);

$resource_name = $request_parts[0] ?? null;
$id = null;
$action = null;
$extra_id = null;

if (isset($request_parts[1]) && is_numeric($request_parts[1])) {
    $id = (int) $request_parts[1];
    $action = $request_parts[2] ?? null;

    // Gestisce sia /gruppi/ID/add/ID che /tasks/ID/start_subflow/ID
    if (isset($request_parts[3]) && is_numeric($request_parts[3])) {
        $extra_id = (int) $request_parts[3];
    }
}


if (!$resource_name) {
    http_response_code(400);
    echo json_encode(["message" => "Nessuna risorsa specificata."]);
    exit();
}

// Istanziamo il database e il controller
$database = new Database();
$request_method = $_SERVER["REQUEST_METHOD"];
$controller = new ApiController($database, $request_method);

// Passiamo il controllo al controller
$controller->processRequest($resource_name, $id, $action,$extra_id);