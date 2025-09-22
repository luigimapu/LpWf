<?php
// Includiamo tutti i modelli qui, così sono sempre disponibili
namespace old;
use Database;

require_once __DIR__ . '/../models/CrudBaseAbstract.php';
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Utente.php';
require_once __DIR__ . '/../models/Workflow.php';
require_once __DIR__ . '/../models/WorkflowStep.php';
require_once __DIR__ . '/../models/WorkflowIstanza.php';
require_once __DIR__ . '/../models/AzioneStandard.php';

class ApiController_bck
{
    private $db_instance;
    private $request_method;

    // Mappa dall'URL (plurale) al nome della Classe (singolare)
    private $model_map = [
        'tasks' => 'Task',
        'utenti' => 'Utente',
        'workflows' => 'Workflow',
        'workflowsteps' => 'WorkflowStep',
        'workflowistanze' => 'WorkflowIstanza',
        'azioni' => 'AzioneStandard'
    ];

    public function __construct(Database $database, string $method)
    {
        $this->db_instance = $database;
        $this->request_method = $method;
    }

    public function processRequest(?string $resource_name, ?int $id, ?string $action = null)
    {
        if ($action) {
            $this->handleAction($resource_name, $id, $action);
            return;
        }

        $model = $this->getModelInstance($resource_name);
        if (!$model) {
            $this->sendResponse(404, ["message" => "Risorsa '{$resource_name}' non trovata."]);
            return;
        }

        switch ($this->request_method) {
            case 'GET':
                $id ? $this->handleReadOne($model, $id) : $this->handleReadAll($model, $resource_name);
                break;
            case 'POST':
                $this->handleCreate($model);
                break;
            case 'PUT':
                $id ? $this->handleUpdate($model, $id) : $this->sendResponse(400, ["message" => "ID mancante per PUT."]);
                break;
            case 'DELETE':
                $id ? $this->handleDelete($model, $id) : $this->sendResponse(400, ["message" => "ID mancante per DELETE."]);
                break;
            default:
                $this->sendResponse(405, ["message" => "Metodo '{$this->request_method}' non gestito."]);
                break;
        }
    }

    private function handleAction($resource, $id, $action)
    {
        if (!$id) {
            $this->sendResponse(400, ["message" => "ID risorsa mancante per l'azione."]);
            return;
        }
        switch ("$resource/$action") {
            case 'workflows/start':
                if ($this->request_method === 'POST') $this->handleStartInstance($id);
                else $this->sendResponse(405, ["message" => "Usare metodo POST per 'start'."]);
                break;
            case 'tasks/assign':
                if ($this->request_method === 'PUT') $this->handleAssignTask($id);
                else $this->sendResponse(405, ["message" => "Usare metodo PUT per 'assign'."]);
                break;
            case 'tasks/complete':
                if ($this->request_method === 'PUT') $this->handleCompleteTask($id);
                else $this->sendResponse(405, ["message" => "Usare metodo PUT per 'complete'."]);
                break;
            default:
                $this->sendResponse(400, ["message" => "Azione '{$action}' non valida per '{$resource}'."]);
                break;
        }
    }

    // --- METODI CRUD GENERICI ---

    private function handleReadAll($model, $resource_name)
    {
        $params = $_GET;
        unset($params['url']);
        if ($resource_name === 'utenti' && !empty($params['search'])) {
            $results = $model->search($params['search']);
        } else {
            $results = $model->findAll($params);
        }
        $this->sendResponse(200, $results);
    }

    private function handleReadOne($model, int $id)
    {
        if ($model->find($id)) {
            $this->sendResponse(200, $model->toArray());
        } else {
            $this->sendResponse(404, ["message" => "Record con ID {$id} non trovato."]);
        }
    }

    private function handleCreate($model)
    {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(400, ["message" => "Dati JSON non validi."]);
            return;
        }
        foreach ($data as $key => $value) {
            if (property_exists($model, $key)) $model->{$key} = $value;
        }
        if ($model->create()) {
            $this->sendResponse(201, ["message" => "Record creato.", "id" => $model->id]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile creare il record."]);
        }
    }

    private function handleUpdate($model, int $id)
    {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(400, ["message" => "Dati JSON non validi."]);
            return;
        }
        if (!$model->find($id)) {
            $this->sendResponse(404, ["message" => "Record con ID {$id} non trovato."]);
            return;
        }
        foreach ($data as $key => $value) {
            if ($key === 'id') continue;
            if (property_exists($model, $key)) $model->{$key} = $value;
        }
        if ($model->update()) {
            $this->sendResponse(200, ["message" => "Record aggiornato."]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile aggiornare il record."]);
        }
    }

    private function handleDelete($model, int $id)
    {
        if (!$model->find($id)) {
            $this->sendResponse(404, ["message" => "Record con ID {$id} non trovato."]);
            return;
        }
        if ($model->delete()) {
            $this->sendResponse(200, ["message" => "Record cancellato."]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile cancellare il record."]);
        }
    }

    // --- METODI PER AZIONI SPECIFICHE ---

    private function handleStartInstance(int $workflowModelId)
    { /* ... implementazione completa ... */
    }

    private function handleAssignTask(int $taskId)
    { /* ... implementazione completa ... */
    }

    private function handleCompleteTask(int $taskId)
    { /* ... implementazione completa ... */
    }

    // --- HELPERS ---

    private function getModelInstance(string $resource_name)
    {
        if (isset($this->model_map[$resource_name])) {
            $class_name = $this->model_map[$resource_name];
            if (class_exists($class_name)) {
                return new $class_name($this->db_instance);
            }
        }
        return null;
    }

    private function sendResponse(int $statusCode, $data)
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=UTF-8');
        }
        // Aggiungiamo un flag per evitare errori di encoding su dati non UTF-8
        echo json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE);
    }
}