<?php
// Headers globali per CORS e JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Content-Language: it-IT");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestione della richiesta pre-flight OPTIONS per CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Includiamo tutto ciò che serve
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/ApiController.php';

// Includiamo tutti i modelli così il controller può trovarli
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Utente.php';
require_once __DIR__ . '/../models/Workflow.php';
require_once __DIR__ . '/../models/WorkflowStep.php';
require_once __DIR__ . '/../models/AzioneStandard.php';
require_once __DIR__ . '/../models/WorkflowIstanza.php';



// --- Parsing dell'URL ---
$uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$uri_segments = explode('/', $uri);

// Troviamo il segmento 'api' per rendere il path relativo
$api_index = array_search('api', $uri_segments);
if ($api_index === false) {
    http_response_code(400);
    echo json_encode(["message" => "Endpoint API non valido."]);
    exit();
}

// Estraiamo le parti che ci servono (risorsa, id, azione)
$request_parts = array_slice($uri_segments, $api_index + 1);

$resource_name = $request_parts[0] ?? null;
$id = null;
$action = null;

// Logica per distinguere tra /tasks/{id} e /tasks/{id}/action
if (isset($request_parts[1])) {
    if (is_numeric($request_parts[1])) {
        $id = (int) $request_parts[1];
        // Se c'è una terza parte, è un'azione
        $action = $request_parts[2] ?? null;
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

// Passiamo l'intera istanza di Database, è più utile della sola connessione
$controller = new ApiController($database, $request_method);

// Passiamo il controllo al controller
$controller->processRequest($resource_name, $id, $action);