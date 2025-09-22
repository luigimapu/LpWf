<?php
// Imposta l'header per visualizzare l'output come HTML ben formattato
header('Content-Type: text/html; charset=utf-8');

// Includiamo le classi necessarie
require_once 'config/Database.php';
require_once 'models/Workflow.php';
require_once 'models/WorkflowStep.php';

// Inizializziamo il database
$database = new Database();

echo "<h1>Test di Gestione Workflow</h1>";

try {
    // === 1. CREAZIONE DI UN NUOVO WORKFLOW ===
    echo "<h2>1. Creazione del workflow 'Approvazione Fatture'...</h2>";
    
    // Creiamo l'oggetto Workflow e impostiamo le sue proprietà
    $workflow_model = new Workflow($database);
    $workflow_model->nome_workflow = 'Approvazione Fatture Fornitori';
    $workflow_model->descrizione = 'Processo standard per l\'approvazione e il pagamento delle fatture in entrata.';
    $workflow_model->attivo = 1;

    // Chiamiamo create() e otteniamo l'ID dalla proprietà dell'oggetto
    if ($workflow_model->create()) {
        $new_workflow_id = $workflow_model->id;
        echo "<p style='color:green;'>OK: Nuovo workflow creato con successo. ID: <strong>$new_workflow_id</strong></p>";
    } else {
        throw new Exception("ERRORE: La creazione del workflow è fallita.");
    }

    // === 2. CREAZIONE DEI PASSI PER IL WORKFLOW ===
    echo "<h2>2. Aggiunta dei passi (steps) al workflow...</h2>";
    
    // Creiamo il primo passo
    $step1_model = new WorkflowStep($database);
    $step1_model->workflow_id = $new_workflow_id;
    $step1_model->nome_passo = 'Verifica e Caricamento Dati';
    $step1_model->descrizione_passo = 'La segreteria verifica la correttezza della fattura e la carica a sistema.';
    $step1_model->ordine = 1;
    $step1_model->ruolo_responsabile_id = 1; // ID del ruolo "Segreteria" (ipotetico)

    if ($step1_model->create()) {
        echo "<p style='color:green;'>OK: Creato Passo 1 con ID: <strong>{$step1_model->id}</strong></p>";
    } else {
        throw new Exception("ERRORE: La creazione del Passo 1 è fallita.");
    }

    // Creiamo il secondo passo
    $step2_model = new WorkflowStep($database);
    $step2_model->workflow_id = $new_workflow_id;
    $step2_model->nome_passo = 'Approvazione del Manager';
    $step2_model->descrizione_passo = 'Il manager di riferimento approva l\'importo e la spesa.';
    $step2_model->ordine = 2;
    $step2_model->ruolo_responsabile_id = 2; // ID del ruolo "Manager" (ipotetico)
    
    if ($step2_model->create()) {
         echo "<p style='color:green;'>OK: Creato Passo 2 con ID: <strong>{$step2_model->id}</strong></p>";
    } else {
        throw new Exception("ERRORE: La creazione del Passo 2 è fallita.");
    }

    // === 3. LETTURA E VERIFICA DEI DATI INSERITI ===
    echo "<h2>3. Lettura e verifica dei dati...</h2>";
    
    // Troviamo il workflow per ID
    $workflow_da_leggere = new Workflow($database);
    if ($workflow_da_leggere->find($new_workflow_id)) {
        echo "<h3>Workflow Trovato:</h3>";
        // Usiamo print_r per visualizzare l'oggetto
        echo "<pre>";
        print_r($workflow_da_leggere);
        echo "</pre>";
    }

    // Troviamo tutti i passi associati a questo workflow
    $step_da_leggere = new WorkflowStep($database);
    $found_steps = $step_da_leggere->findAll(['workflow_id' => $new_workflow_id], 'ordine ASC');
    echo "<h3>Passi del Workflow Trovati (ordinati per sequenza):</h3>";
    echo "<pre>" . print_r($found_steps, true) . "</pre>";

    echo "<hr><h2>Test completato con successo!</h2>";

} catch (Exception $e) {
    echo "<p style='color:red;'><strong>ERRORE DURANTE IL TEST:</strong> " . $e->getMessage() . "</p>";
}

?>