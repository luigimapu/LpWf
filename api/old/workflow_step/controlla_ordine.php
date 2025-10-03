<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);
include_once '../../config/Database.php';
include_once '../../models/WorkflowStep.php';

$database = new Database();
$data = json_decode(file_get_contents("php://input"));

// --- Validazione Input Essenziali ---
if (empty($data->workflow_id) || empty($data->ordine) || empty($data->nome_passo) || empty($data->ruolo_responsabile_id) || empty($data->azione_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Dati incompleti. 'workflow_id', 'ordine', 'nome_passo', 'ruolo_responsabile_id' e 'azione_id' sono obbligatori."]);
    exit();
}

// --- Validazione Avanzata dell'Azione e dei Parametri ---
try {
    // 1. Verifica che l'azione esista
    $azione_info = $database->selectOne("SELECT id, parametri_richiesti FROM azioni_standard WHERE id = ?", [$data->azione_id]);
    if (!$azione_info) {
        http_response_code(400);
        echo json_encode(["message" => "Azione con ID {$data->azione_id} non valida o non trovata."]);
        exit();
    }

    // 2. Verifica che i parametri richiesti siano stati forniti
    $parametri_richiesti = json_decode($azione_info['parametri_richiesti'], true, 512, JSON_THROW_ON_ERROR);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Configurazione parametri per azione ID {$data->azione_id} non valida nel DB.");
    }
    
    if (!isset($data->parametri_azione) || !is_object($data->parametri_azione)) {
         http_response_code(400);
         echo json_encode(["message" => "Il campo 'parametri_azione' deve essere un oggetto JSON."]);
         exit();
    }

    // Controlla che ogni parametro richiesto esista nell'input
    foreach ($parametri_richiesti as $chiave) {
        if (!property_exists($data->parametri_azione, $chiave)) {
            http_response_code(400);
            echo json_encode([
                "message" => "Parametro mancante per l'azione selezionata.",
                "parametro_mancante" => $chiave,
                "parametri_richiesti" => $parametri_richiesti
            ], JSON_THROW_ON_ERROR);
            exit();
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Errore interno durante la validazione dell'azione: " . $e->getMessage()]);
    exit();
}

// --- Logica Esistente per Controllo Ordine e Sottopasso ---
$step_model = new WorkflowStep($database);
$workflow_id = (int)$data->workflow_id;
$ordine = (int)$data->ordine;
$sottopasso = isset($data->sottopasso) && is_numeric($data->sottopasso) ? (int)$data->sottopasso : 1;

$existing_steps = $step_model->findAll(['workflow_id' => $workflow_id, 'ordine' => $ordine], 'sottopasso ASC');
$ultimo_passo = count($existing_steps);

if (count($existing_steps) > 0 && $sottopasso <= $ultimo_passo) {
    http_response_code(409); // Conflict
    echo json_encode([
        "status" => "Errore",
        "message" => "Un passo (o più) esiste già a questo livello di ordine.",
        "next_sottopasso" => count($existing_steps) + 1,
        "steps_at_this_order" => $existing_steps
    ], JSON_UNESCAPED_UNICODE);

} else {
    // --- Creazione del Passo con la Nuova Struttura ---
    if ($sottopasso - $ultimo_passo > 1) {
        $sottopasso = $ultimo_passo + 1;
    }
    
    $step = new WorkflowStep($database);
    $step->workflow_id = $workflow_id;
    $step->nome_passo = $data->nome_passo;
    $step->ruolo_responsabile_id = $data->ruolo_responsabile_id;
    $step->descrizione_passo = $data->descrizione_passo ?? null;
    $step->ordine = $ordine;
    $step->sottopasso = $sottopasso;
    $step->scadenza_giorni = $data->scadenza_giorni ?? 2;
    $step->bloccante = isset($data->bloccante) ? filter_var($data->bloccante, FILTER_VALIDATE_BOOLEAN) : true;

    // Assegnazione dei nuovi campi
    $step->azione_id = $data->azione_id;
    $step->parametri_azione = $data->parametri_azione; // Passiamo l'oggetto, sarà codificato dal modello

    if ($step->create()) {
        $step->find($step->id); // Ricarichiamo per avere i dati puliti dal DB

        http_response_code(201);
        echo json_encode([
            "message" => "Passo creato con successo.",
            "step" => [
                "id" => $step->id,
                "workflow_id" => $step->workflow_id,
                "nome_passo" => $step->nome_passo,
                "descrizione_passo" => $step->descrizione_passo,
                "ordine" => $step->ordine,
                "sottopasso" => $step->sottopasso,
                "ruolo_responsabile_id" => $step->ruolo_responsabile_id,
                "bloccante" => (bool)$step->bloccante, // <-- Mostriamo il valore,
                "scadenza_giorni" => $step->scadenza_giorni,
                "azione_id" => $step->azione_id,
                "parametri_azione" => $step->getParametriAsArray() // Restituiamo un array PHP pulito
            ]
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Impossibile creare il passo."], JSON_THROW_ON_ERROR);
    }
}
?>