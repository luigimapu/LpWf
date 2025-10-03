<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once '../../config/Database.php';
include_once '../../models/Task.php';

$database = new Database();
$task = new Task($database);

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(["message" => "ID del task non fornito. Impossibile procedere."]);
    exit();
}

if (!isset($data->id_stato) && !isset($data->id_utente_assegnato)) {
    http_response_code(400);
    echo json_encode(["message" => "Nessun dato da aggiornare. Fornire 'id_stato' o 'id_utente_assegnato'."]);
    exit();
}

// Tentiamo di trovare il task
if (!$task->find($data->id)) {
    http_response_code(404);
    echo json_encode(["message" => "Task non trovato."]);
    exit();
}

// --- DEBUG: STAMPIAMO IL CONTENUTO DELL'OGGETTO TASK E USCIAMO ---
// Questo ci mostrerà se la proprietà 'id' è stata valorizzata correttamente.
echo "DEBUG OUTPUT:\n";
var_dump($task);
exit();
// --- FINE DEBUG ---


// --- Validazione delle Chiavi Esterne (con il metodo corretto) ---
if (isset($data->id_stato)) {
    // ... il resto del codice rimane uguale
    $result_stato = $database->select("SELECT id FROM stati_task WHERE id = ?", [$data->id_stato]);
    if (!$result_stato || count($result_stato) == 0) {
        http_response_code(400);
        echo json_encode(["message" => "Stato con ID {$data->id_stato} non valido."]);
        exit();
    }
    $task->id_stato = $data->id_stato;
}

if (isset($data->id_utente_assegnato)) {
    if ($data->id_utente_assegnato !== null) {
        $result_utente = $database->select("SELECT id FROM utenti WHERE id = ?", [$data->id_utente_assegnato]);
        if (!$result_utente || count($result_utente) == 0) {
            http_response_code(400);
            echo json_encode(["message" => "Utente con ID {$data->id_utente_assegnato} non valido."]);
            exit();
        }
    }
    $task->id_utente_assegnato = $data->id_utente_assegnato;
}

// --- Esecuzione dell'aggiornamento ---
if ($task->update()) {
    http_response_code(200);
    echo json_encode(["message" => "Task aggiornato con successo."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Impossibile aggiornare il task."]);
}
?>