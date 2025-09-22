<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Includiamo le classi
include_once '../../config/Database.php';
include_once '../../models/Utente.php';

$database = new Database();
$user = new Utente($database);

// Controlliamo se è stato passato un parametro "search" nell'URL 
// (es. .../leggi.php?search=Mario)
$searchTerm = isset($_GET['search']) ? $_GET['search'] : null;

// Usiamo il nostro nuovo metodo search() per recuperare gli utenti
$users_list = $user->search($searchTerm);

if (count($users_list) > 0) {
    http_response_code(200);
    echo json_encode($users_list);
} else {
    // Restituiamo un array vuoto se non ci sono risultati, è più facile da gestire per il frontend
    http_response_code(200);
    echo json_encode([]);
}