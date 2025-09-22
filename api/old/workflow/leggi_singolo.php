<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/Workflow.php';

// Inizializziamo il database e il modello
$database = new Database();
$workflow = new Workflow($database);

// Recuperiamo l'ID dall'URL. Se non è presente, terminiamo lo script.
// Usiamo isset() per controllare se il parametro 'id' esiste
// e filter_var per assicurarci che sia un numero intero valido
$workflow_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

if (!$workflow_id) {
    http_response_code(400); // 400 Bad Request
    echo json_encode(["message" => "ID del workflow non fornito o non valido."],JSON_UNESCAPED_UNICODE);
    exit();
}

// Usiamo il nuovo metodo per trovare il workflow e i suoi passi
if ($workflow->findWithSteps($workflow_id)) {
    // Se trovato, prepariamo la risposta
    $response = [
        "id" => $workflow->id,
        "nome_workflow" => $workflow->nome_workflow,
        "descrizione" => $workflow->descrizione,
        "attivo" => $workflow->attivo,
        "data_creazione" => $workflow->data_creazione,
        "steps" => $workflow->steps // Qui includiamo l'array dei passi!
    ];

    http_response_code(200); // 200 OK
    echo json_encode($response,JSON_UNESCAPED_UNICODE);
} else {
    // Se non viene trovato nulla con quell'ID
    http_response_code(404); // 404 Not Found
    echo json_encode(["message" => "Workflow non trovato con ID: " . $workflow_id]);
}
?>