<?php
// Headers necessari
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Includiamo le classi
include_once '../../config/Database.php';
include_once '../../models/Task.php';

// Istanziamo il Database e l'oggetto Task
$database = new Database();
$task = new Task($database);

// Controlliamo se l'ID è stato passato nell'URL
if(isset($_GET['id']))
$ricerca = ['id' =>$_GET['id']];
elseif(isset($_GET['id_workflow']))
$ricerca=['id_workflow' =>$_GET['id_workflow']];

// Usiamo il metodo find() per leggere i dati del task
$task_item=$task->findAll($ricerca,'id ASC');
//print_r($tasks_list);
if(!empty($task_item)){

    // Codice di risposta 200 OK
    http_response_code(200);
    echo json_encode($task_item);

} else {
    // Se il task non viene trovato, restituiamo un 404
    http_response_code(404);
    echo json_encode(["message" => "Task non trovato."]);
}
?>
