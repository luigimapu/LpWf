<?php
// Headers necessari per una risposta API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Includiamo i file di configurazione e il modello
include_once '../../config/Database.php';
include_once '../../models/Workflow.php';

// Inizializziamo il database e creiamo un'istanza del modello Workflow
$database = new Database();
$workflow_model = new Workflow($database);

// Eseguiamo la query per trovare tutti i workflow, ordinati per nome
$workflows_list = $workflow_model->findAll('nome_workflow ASC');
$num = count($workflows_list);

// Verifichiamo se abbiamo trovato dei risultati
if ($num > 0) {
    // Se ci sono workflow, li strutturiamo in un array per la risposta JSON
    $response = [
        "message" => "Elenco dei workflow recuperato con successo.",
        "records" => $workflows_list
    ];

    // Impostiamo il codice di risposta HTTP - 200 OK
    http_response_code(200);

    // Convertiamo l'array in JSON e lo stampiamo
    echo json_encode($response);
} else {
    // Se non ci sono workflow, inviamo una risposta di errore
    
    // Impostiamo il codice di risposta HTTP - 404 Not Found
    http_response_code(404);

    // Prepariamo il messaggio di errore e lo inviamo
    echo json_encode(
        ["message" => "Nessun workflow trovato nel database."]
    );
}
?>