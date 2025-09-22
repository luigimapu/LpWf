<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Includi i file necessari
include_once '../../config/Database.php';
include_once '../../models/WorkflowStep.php';

// Inizializza il DB e crea gli oggetti
$database = new Database();
// LA CORREZIONE È QUI: Passiamo l'oggetto $database direttamente, come negli altri script
$step = new WorkflowStep($database);

// 1. Controlla se 'workflow_id' è stato passato nell'URL
$workflow_id = isset($_GET['workflow_id']) && is_numeric($_GET['workflow_id']) ? (int)$_GET['workflow_id'] : null;

/*if (!$workflow_id) {
    // Se l'ID del workflow non è fornito o non è valido, restituisci un errore
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "ID del workflow mancante o non valido."]);
    exit();
}*/

if($workflow_id)
// 2. Esegui la query per trovare tutti i passaggi per il workflow specificato
// Il metodo findAll si aspetta un array di condizioni e una stringa per l'ordinamento
$steps = $step->findAll(['workflow_id' => $workflow_id], 'ordine ASC');
else
    $steps = $step->findAll();
// 3. Controlla se sono stati trovati dei risultati
if ($steps && count($steps) > 0) {
    // Se ci sono risultati, li strutturiamo per il JSON
    // La classe CrudBase restituisce già array associativi, non oggetti
    $response = [
        "message" => "Elenco dei passi recuperato con successo.",
        "records" => $steps
    ];

    // Imposta il codice di risposta a 200 OK e restituisci il JSON
    http_response_code(200);
    echo json_encode($response);
} else {
    // Se non vengono trovati passaggi per quel workflow
    http_response_code(404); // Not Found
    echo json_encode(["message" => "Nessun passo trovato per questo workflow."]);
}
?>