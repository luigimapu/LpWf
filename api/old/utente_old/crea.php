<?php
// Headers necessari per la risposta JSON e CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Includiamo i file di configurazione e il modello Utente
include_once '../../config/Database.php';
include_once '../../models/Utente.php';

// Istanziamo il Database e l'oggetto Utente
$database = new Database();
$utente = new Utente($database);

// Otteniamo i dati inviati nel corpo della richiesta
$data = json_decode(file_get_contents("php://input"));

// --- Validazione dell'Input ---

// 1. Controlliamo che i dati essenziali non siano vuoti
if (empty($data->nome) || empty($data->cognome) || empty($data->email)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Dati incompleti. I campi 'nome', 'cognome' e 'email' sono obbligatori."]);
    exit();
}

// 2. Verifichiamo il formato dell'email
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["message" => "Il formato dell'email non è valido."]);
    exit();
}

// 3. Controlliamo che l'email non sia già in uso per evitare duplicati
$query_email = "SELECT id FROM " . $utente->getTableName() . " WHERE email = ?";
$result = $database->select($query_email, [$data->email]);
if ($result && count($result) > 0) {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Impossibile creare l'utente. L'email '{$data->email}' è già registrata."]);
    exit();
}

// --- Assegnazione dei Dati all'Oggetto ---
$utente->nome = $data->nome;
$utente->cognome = $data->cognome;
$utente->email = $data->email;

// --- Creazione dell'Utente ---
if ($utente->create()) {
    // Se la creazione va a buon fine, restituiamo un codice 201 (Created)
    http_response_code(201);
    echo json_encode([
        "message" => "Utente creato con successo.",
        "id_utente_creato" => $utente->id // L'ID viene valorizzato dal metodo create()
    ]);
} else {
    // Se qualcosa va storto durante l'inserimento nel DB
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Impossibile creare l'utente. Errore del server."]);
}
?>