<?php
// Headers necessari per l'API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); // Specifichiamo che questo endpoint accetta solo richieste POST
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Includiamo i file di configurazione e il modello
include_once '../../config/Database.php';
include_once '../../models/Workflow.php';

// Inizializziamo il database e creiamo un'istanza del modello
$database = new Database();
$workflow = new Workflow($database);

// 1. Leggiamo i dati JSON inviati nella richiesta
// file_get_contents("php://input") legge il corpo ("body") della richiesta
$data = json_decode(file_get_contents("php://input"));

// 2. Validazione dei dati: ci assicuriamo che il nome non sia vuoto
// Usiamo !empty() per controllare che il campo esista e non sia vuoto
if (
    !empty($data->nome_workflow)
) {
    // 3. Assegniamo i dati ricevuti alle proprietà dell'oggetto Workflow
    $workflow->nome_workflow = $data->nome_workflow;

    // La descrizione è opzionale, quindi usiamo un operatore ternario
    $workflow->descrizione = !empty($data->descrizione) ? $data->descrizione : null;
    
    // Il campo 'attivo' è opzionale, di default lo impostiamo a 1 (true)
    $workflow->attivo = $data->attivo ?? 1;

    // 4. Tentiamo di creare il workflow nel database
    if ($workflow->create()) {
        // Se la creazione va a buon fine, inviamo una risposta positiva
        http_response_code(201); // 201 Created: lo standard per una creazione riuscita

        // Creiamo una risposta che include il nuovo workflow appena creato
        echo json_encode([
            "message" => "Workflow creato con successo.",
            "workflow" => [
                //"id" => $workflow->id,
                "nome_workflow" => $workflow->nome_workflow,
                "descrizione" => $workflow->descrizione,
                "attivo" => $workflow->attivo,
                "data_creazione" => $workflow->data_creazione
            ]
        ]);
    } else {
        // Se la creazione fallisce (es. errore del database)
        http_response_code(503); // 503 Service Unavailable
        echo json_encode(["message" => "Impossibile creare il workflow."]);
    }
} else {
    // Se i dati inviati sono incompleti
    http_response_code(400); // 400 Bad Request
    echo json_encode(["message" => "Impossibile creare il workflow. I dati sono incompleti. 'nome_workflow' è obbligatorio."]);
}
?>