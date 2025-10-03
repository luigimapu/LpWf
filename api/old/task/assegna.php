<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT"); // Accetta sia POST che PUT
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/Task.php';

// Istanziamo il Database e l'oggetto Task
$database = new Database();
//$db_connection = $database->conn; // Assumendo che la connessione sia pubblica
$task = new Task($database);

// Otteniamo i dati inviati nel corpo della richiesta
$data = json_decode(file_get_contents("php://input"));

// 1. Validazione dell'input ricevuto
if (empty($data->task_id) || empty($data->user_id)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Dati incompleti. Sono necessari 'task_id' e 'user_id'."]);
    exit();
}

// 2. Carichiamo il task dal database usando il suo ID
if (!$task->find($data->task_id)) {
    http_response_code(404); // Not Found
    echo json_encode(["message" => "Task con ID {$data->task_id} non trovato."]);
    exit();
}

// 3. Eseguiamo la logica di business specifica per l'assegnazione
if (!$task->assegnaUtente((int)$data->user_id)) {
    http_response_code(409); // Conflict
    echo json_encode([
        "message" => "Impossibile assegnare il task. Potrebbe essere già stato assegnato, essere in lavorazione o chiuso.",
        "stato_attuale" => $task->id_stato
    ]);
    exit();
}

// 4. Se la logica di business è andata a buon fine, salviamo le modifiche sul database
if ($task->update()) {
    http_response_code(200); // OK
    echo json_encode(["message" => "Task assegnato con successo."]);
} else {
    // Questo errore non dovrebbe accadere se la logica precedente ha funzionato, ma è una sicurezza
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Errore durante il salvataggio dell'assegnazione del task."]);
}

?>