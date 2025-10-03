<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT"); // Specifichiamo il metodo PUT per l'aggiornamento
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Includiamo i file necessari
include_once '../../config/Database.php';
include_once '../../models/WorkflowStep.php';

// Inizializziamo il database e il modello
$database = new Database();
$step = new WorkflowStep($database);

// Leggiamo i dati JSON inviati nel corpo della richiesta
$data = json_decode(file_get_contents("php://input"));
//print_r($data);
// Validazione di base: assicuriamoci che l'ID sia stato fornito

if (empty($data->id)) {
    http_response_code(400); // 400 Bad Request
    echo json_encode(["message" => "Impossibile aggiornare lo step workflow. ID non fornito."]);
    exit();
}

// Assegniamo l'ID all'oggetto per poterlo cercare
$step->id = $data->id;
//$step=$data;
//print_r($step);
// Verifichiamo se l'oggetto esiste prima di tentare l'aggiornamento
if (!$step->find($step->id)) {
    http_response_code(404); // 404 Not Found
    echo json_encode(["message" => "Nessuno step workflow trovato con l'ID specificato."]);
    exit();
}

//$step->workflow_id = $data->workflow_id;
$step->nome_passo = $data->nome_passo;
$step->ruolo_responsabile_id = $data->ruolo_responsabile_id;
$step->descrizione_passo = !empty($data->descrizione_passo) ? $data->descrizione_passo : null;
$step->ordine = $data->ordine;//) && is_numeric($data->ordine) ? (int)$data->ordine : null;
$step->sottopasso=$data->sottopasso??null;
$step->scadenza_giorni = $data->scadenza_giorni ?? 2; // La segreteria ha 2 giorni per caricare la fattura
$step->codice_azione = $data->codice_azione ??null;
$step->descrizione_azione = $data->descrizione_azione ?? null;

//print_r($step);
// Tentiamo di eseguire l'aggiornamento
if ($step->update()) {
    // Se l'aggiornamento va a buon fine
    http_response_code(200); // 200 OK
    echo json_encode(["message" => "Step Workflow  aggiornato con successo."]);
} else {
    // Se l'aggiornamento fallisce
    http_response_code(503); // 503 Service Unavailable
    echo json_encode(["message" => "Impossibile aggiornare lo step workflow."]);
}
