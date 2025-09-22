<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';
include_once '../../models/Task.php';

$database = new Database();
$db = $database->getConnection();

$task = new Task($db);

$data = json_decode(file_get_contents("php://input"));

if (empty($data->task_id)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Dati incompleti. 'task_id' è obbligatorio."]);
    exit();
}

// 1. Troviamo il task da aggiornare
if (!$task->find($data->task_id)) {
    http_response_code(404); // Not Found
    echo json_encode(["message" => "Task con ID {$data->task_id} non trovato."]);
    exit();
}

// 2. Applichiamo la logica di business del modello
if (!$task->completaTask()) {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Impossibile completare il task. Deve essere nello stato 'In Lavorazione'."]);
    exit();
}

// 3. Se la logica è valida, salviamo le modifiche
if ($task->update()) {
    http_response_code(200); // OK
    echo json_encode(["message" => "Task completato con successo."]);
} else {
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Impossibile aggiornare il task nel database."]);
}
