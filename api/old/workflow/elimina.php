<?php

// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE"); // Specifichiamo il metodo DELETE
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/Workflow.php';

// Inizializziamo il database e il modello
$database = new Database();
$workflow = new Workflow($database);

// Leggiamo i dati JSON inviati nel corpo della richiesta
// Anche se potremmo passare l'ID via URL, per coerenza con l'update usiamo il body.
$data = json_decode(file_get_contents("php://input"));

// Validazione di base: assicuriamoci che l'ID sia stato fornito
if (empty($data->id)) {
    http_response_code(400); // 400 Bad Request
    echo json_encode(["message" => "Impossibile eliminare il workflow. ID non fornito."]);
    exit();
}

// Assegniamo l'ID all'oggetto in modo che il metodo delete() sappia quale record cancellare
$workflow->id = $data->id;

// Verifichiamo se l'oggetto esiste prima di tentare l'eliminazione
if (!$workflow->find($workflow->id)) {
    http_response_code(404); // 404 Not Found
    echo json_encode(["message" => "Nessun workflow trovato con l'ID specificato."]);
    exit();
}

// Tentiamo di eliminare il workflow
if ($workflow->delete()) {
    // Se l'eliminazione va a buon fine
    http_response_code(200); // 200 OK
    echo json_encode(["message" => "Workflow eliminato con successo."]);
} else {
    // Se l'eliminazione fallisce
    http_response_code(503); // 503 Service Unavailable
    echo json_encode(["message" => "Impossibile eliminare il workflow."]);
}
