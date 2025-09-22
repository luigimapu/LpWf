<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Includiamo i file di base
include_once '../../config/Database.php';
include_once '../../models/azioni.php';
// Istanziamo il Database
$database = new Database();

// Query per ottenere tutte le azioni, ordinate per nome per una migliore UX
$query = "SELECT id, codice_azione, nome_azione, parametri_richiesti FROM azioni_standard ORDER BY nome_azione ASC";

$azioni = $database->select($query);

if ($azioni !== false && count($azioni) > 0) {
    http_response_code(200);
    echo json_encode($azioni);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Nessuna azione standard trovata nel sistema."]);
}
?>