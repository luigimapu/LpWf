<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once '../../config/Database.php';
include_once '../../models/WorkflowStep.php';

$database = new Database();
$step = new WorkflowStep($database);

$data = json_decode(file_get_contents("php://input"));
print_r($data);
if (empty($data->workflow_id) || empty($data->nome_passo) || empty($data->ruolo_responsabile_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Dati incompleti. 'workflow_id', 'nome_passo' e 'ruolo_responsabile_id' sono obbligatori."]);
    exit();
}

// Assegna i dati all'oggetto. L'ordine è ora opzionale.
$step->workflow_id = $data->workflow_id;
$step->nome_passo = $data->nome_passo;
$step->ruolo_responsabile_id = $data->ruolo_responsabile_id;
$step->descrizione_passo = !empty($data->descrizione_passo) ? $data->descrizione_passo : null;
$step->ordine = isset($data->ordine) && is_numeric($data->ordine) ? (int)$data->ordine : null;
// Nuovi campi
$step->scadenza_giorni = $data->scadenza_giorni ?? 2; // La segreteria ha 2 giorni per caricare la fattura
//$step->codice_azione = 'VERIFICA_DATI_FATTURA';
//$step->descrizione_azione = 'L\'utente deve validare i dati della fattura e allegare il documento.';
// Assegnazione dei nuovi campi
$step->azione_id = $data->azione_id;
$step->parametri_azione = $data->parametri_azione; // Passiamo l'oggetto, sarà codificato dal modello

// Gestiamo il nuovo campo 'bloccante'. Se non è presente, il DB userà il default (TRUE).
// Lo impostiamo solo se esplicitamente fornito.
if (isset($data->bloccante)) {
    $step->bloccante = filter_var($data->bloccante, FILTER_VALIDATE_BOOLEAN);
}

// Tenta di creare il passo.
if ($step->create()) {
    // Ricarichiamo i dati dal DB per essere sicuri di avere anche i valori di default
    $step->find($step->id);

    http_response_code(201);
    echo json_encode([
        "message" => "Passo creato con successo.",
        "step" => [
            "id" => $step->id,
            "workflow_id" => $step->workflow_id,
            "nome_passo" => $step->nome_passo,
            "descrizione_passo" => $step->descrizione_passo,
            "ordine" => $step->ordine,
            "ruolo_responsabile_id" => $step->ruolo_responsabile_id,
            "bloccante" => (bool)$step->bloccante, // <-- Mostriamo il valore
            "scadenza_giorni" => $step->scadenza_giorni,
            "codice_azione" => $step->azione_id,
            "descrizione_azione" => $step->parametri_azione
        ]
    ]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Impossibile creare il passo."]);
}

?>