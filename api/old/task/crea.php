<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/Task.php';

// Istanziamo il Database e l'oggetto Task
$database = new Database();
$task = new Task($database); // CORRETTO: Passiamo l'oggetto Database

// Otteniamo i dati inviati nel corpo della richiesta
$data = json_decode(file_get_contents("php://input"));

// --- Validazione dell'Input ---

if (empty($data->nome) || empty($data->id_workflow)) {
    http_response_code(400);
    echo json_encode(["message" => "Dati incompleti. I campi 'nome' e 'id_workflow' sono obbligatori."]);
    exit();
}

// CORRETTO: Usiamo il metodo select() della classe Database per la validazione
$query_workflow = "SELECT id FROM workflows WHERE id = ?";
$result = $database->select($query_workflow, [$data->id_workflow]);
//print_r($data);
if (!$result || count($result) == 0) {
    http_response_code(400);
    echo json_encode(["message" => "Impossibile creare il task. Il workflow con ID {$data->id_workflow} non esiste."]);
    exit();
}

// --- Assegnazione dei dati ---
$task->nome = $data->nome;
$task->id_workflow = $data->id_workflow;
$task->descrizione = isset($data->descrizione) ? $data->descrizione : null;
$task->id_stato = isset($data->id_stato) ? $data->id_stato : 1;
$task->id_utente_assegnato = isset($data->id_utente_assegnato) ? $data->id_utente_assegnato : null;

$task->data_aggiornamento = isset($data->data_aggiornamento) ? $data->data_aggiornamento : date("Y-m-d H:i:s");
$task->data_creazione = isset($data->data_creazione) ? $data->data_creazione : date("Y-m-d H:i:s");

//print_r($task);
// --- Creazione del Task ---
if ($task->create()) {
    http_response_code(201);
    echo json_encode([
        "message" => "Task creato con successo.",
        "id_task_creato" => $task->id
    ]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Impossibile creare il task."]);
}
?>