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
include_once '../../models/Utente.php';

// Inizializziamo il database e il modello
$database = new Database();
$utente = new Utente($database);

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
$utente->id = $data->id;
//$step=$data;
//print_r($step);
// Verifichiamo se l'oggetto esiste prima di tentare l'aggiornamento
if (!$utente->find($utente->id)) {
    http_response_code(404); // 404 Not Found
    echo json_encode(["message" => "Nessuno step workflow trovato con l'ID specificato."]);
    exit();
}

// --- Assegnazione dei Dati all'Oggetto ---
$utente->nome = $data->nome ?? null;
$utente->cognome = $data->cognome ?? null;
$utente->email = $data->email ?? null;

//print_r($step);
// Tentiamo di eseguire l'aggiornamento
if ($utente->update()) {
    // Se l'aggiornamento va a buon fine
    http_response_code(200); // 200 OK
    echo json_encode(["message" => "Utente  aggiornato con successo."]);
} else {
    // Se l'aggiornamento fallisce
    http_response_code(503); // 503 Service Unavailable
    echo json_encode(["message" => "Impossibile aggiornare Utente."]);
}
