<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Abilitiamo la visualizzazione degli errori per il debug (da rimuovere in produzione)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Includiamo i file necessari
include_once '../../config/Database.php';
// L'inclusione di Task.php non è strettamente necessaria qui perché non usiamo il modello,
// ma è buona norma mantenerla per coerenza.
include_once '../../models/Task.php';

// Istanziamo il Database
$database = new Database();
// NON serve chiamare getConnection() né istanziare Task,
// perché usiamo il metodo select() direttamente da $database.

// La nostra query di base che unisce task e stati
$query = "SELECT 
            t.id, 
            t.nome, 
            t.descrizione, 
            t.id_workflow, 
            t.id_utente_assegnato,
            t.id_stato, 
            s.nome 
          FROM 
            `task` t 
          LEFT JOIN 
            stati_task s ON t.id_stato = s.id";

$params = [];
$where_clauses = [];

// Aggiungiamo un filtro se viene passato 'workflow_id'
if (isset($_GET['workflow_id']) && !empty($_GET['workflow_id'])) {
    $where_clauses[] = "t.id_workflow = ?";
    $params[] = htmlspecialchars(strip_tags($_GET['workflow_id']));
}

// Aggiungiamo un filtro di ricerca testuale se viene passato 'search'
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $where_clauses[] = "t.nome LIKE ?";
    $params[] = '%' . htmlspecialchars(strip_tags($_GET['search'])) . '%';
}

// Se ci sono clausole WHERE, le aggiungiamo alla query
if (count($where_clauses) > 0) {
    $query .= " WHERE " . implode(' AND ', $where_clauses);
}

$query .= " ORDER BY t.data_creazione DESC";

// Eseguiamo la query usando il metodo select del Database
$results = $database->select($query, $params);

// Controlliamo l'esito della query
if ($results !== false) {
    // La query ha avuto successo, restituiamo i risultati (anche se l'array è vuoto)
    http_response_code(200);
    echo json_encode($results);
} else {
    // Si è verificato un errore durante l'esecuzione della query
    http_response_code(503); // Service Unavailable
    echo json_encode(["message" => "Errore durante l'interrogazione del database."]);
}
?>