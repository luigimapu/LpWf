<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT"); // Specifichiamo il metodo PUT per l'aggiornamento
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/Workflow.php';

// Inizializziamo il database e il modello
$database = new Database();
$workflow = new Workflow($database);

// Leggiamo i dati JSON inviati nel corpo della richiesta
$data = json_decode(file_get_contents("php://input"));

// Validazione di base: assicuriamoci che l'ID sia stato fornito
if (empty($data->id)) {
    http_response_code(400); // 400 Bad Request
    echo json_encode(["message" => "Impossibile aggiornare il workflow. ID non fornito."]);
    exit();
}

// Assegniamo l'ID all'oggetto per poterlo cercare
$workflow->id = $data->id;
//print_r("ciao");
// Verifichiamo se l'oggetto esiste prima di tentare l'aggiornamento
if (!$workflow->find($workflow->id)) {
    http_response_code(404); // 404 Not Found
    echo json_encode(["message" => "Nessun workflow trovato con l'ID specificato."]);
    exit();
}

// Ora che sappiamo che l'oggetto esiste, aggiorniamo le sue proprietà
// con i dati ricevuti (se forniti).
// Se un campo non viene passato nel JSON, il suo valore precedente non verrà modificato.
$workflow->nome_workflow = $data->nome_workflow ?? $workflow->nome_workflow;
$workflow->descrizione = $data->descrizione ?? $workflow->descrizione;

// Per 'attivo', se viene passato, lo usiamo, altrimenti manteniamo il vecchio valore.
// Usiamo isset() perché il valore potrebbe essere 0, che è considerato 'empty'.
$workflow->attivo = isset($data->attivo) ? $data->attivo : $workflow->attivo;

// Tentiamo di eseguire l'aggiornamento
if ($workflow->update()) {
    // Se l'aggiornamento va a buon fine
    http_response_code(200); // 200 OK
    echo json_encode(["message" => "Workflow aggiornato con successo."]);
} else {
    // Se l'aggiornamento fallisce
    http_response_code(503); // 503 Service Unavailable
    echo json_encode(["message" => "Impossibile aggiornare il workflow."]);
}
?>