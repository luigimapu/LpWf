<?php

namespace old;
use Database;
use Task;
use Workflow;
use WorkflowIstanza;
use WorkflowStep;

class ApiController
{
    private $db_instance;
    private $request_method;

    // Mappa dall'URL alla classe del Modello
    private $model_map = [
        'tasks' => 'Task',
        'utenti' => 'Utente',
        'workflows' => 'Workflow',
        'workflowsteps' => 'WorkflowStep',
        'azioni' => 'AzioneStandard', // <-- AGGIUNTA QUESTA RIGA
        'workflowistanze' => 'WorkflowIstanza'

    ];

    public function __construct(Database $database, string $method)
    {
        $this->db_instance = $database;
        $this->request_method = $method;
    }

    // ... TUTTO IL RESTO DEL FILE ApiController.php RIMANE INVARIATO ...
    // (Il codice completo è omesso per brevità, ma non devi cambiare nient'altro)

    public function processRequest(?string $resource_name, ?int $id, ?string $action = null)
    {
        // --- 1. GESTIONE AZIONI SPECIFICHE (es. /tasks/{id}/assign) ---
        if ($action) {
            if ($resource_name === 'tasks') {
                if (!$id || $this->request_method !== 'PUT') {
                    $this->sendResponse(400, ["message" => "L'azione '{$action}' richiede un ID nella URL e il metodo PUT."]);
                    return;
                }

                switch ($action) {
                    case 'assign':
                        $this->handleAssignTask($id);
                        return; // Fine dell'esecuzione
                    case 'complete':
                        $this->handleCompleteTask($id);
                        return; // Fine dell'esecuzione

                    case 'start':
                        if ($this->request_method === 'POST') {
                            $this->handleStartInstance($id);
                            return;
                        }
                }
            }
            $this->sendResponse(400, ["message" => "Azione '{$action}' non valida per la risorsa '{$resource_name}'."]);
            return;
        }

        // --- 2. GESTIONE RICHIESTE CRUD GENERICHE (se non è stata specificata un'azione) ---
        $model = $this->getModelInstance($resource_name);
        if (!$model) {
            $this->sendResponse(404, ["message" => "Risorsa '{$resource_name}' non trovata."]);
            return;
        }

        switch ($this->request_method) {
            case 'GET':
                if ($id) {
                    $this->handleReadOne($model, $id);
                } else {
                    $this->handleReadAll($model, $resource_name);
                }
                break;
            case 'POST':
                $this->handleCreate($model);
                break;
            case 'PUT':
                if ($id) {
                    $this->handleUpdate($model, $id);
                } else {
                    $this->sendResponse(400, ["message" => "ID mancante nella URL per l'operazione di aggiornamento (PUT)."]);
                }
                break;
            case 'DELETE':
                if ($id) {
                    $this->handleDelete($model, $id);
                } else {
                    $this->sendResponse(400, ["message" => "ID mancante nella URL per l'operazione di cancellazione (DELETE)."]);
                }
                break;
            default:
                $this->sendResponse(405, ["message" => "Metodo '{$this->request_method}' non gestito per questa risorsa."]);
                break;
        }
    }

    /**
     * AZIONE SPECIFICA: Avvia una nuova istanza di un workflow.
     * Chiamata da: POST /api/workflows/{workflowModelId}/start
     */
    private function handleStartInstance(int $workflowModelId)
    {
        $data = json_decode(file_get_contents("php://input"));

        // --- Inizio della Transazione ---
        try {
            $this->db_instance->conn->beginTransaction();

            // 1. Verifichiamo che il modello di workflow esista
            $workflow_model = new Workflow($this->db_instance->conn);
            if (!$workflow_model->find($workflowModelId)) {
                throw new Exception("Modello di workflow con ID {$workflowModelId} non trovato.", 404);
            }

            // 2. Creazione dell'Istanza di Workflow
            $istanza = new WorkflowIstanza($this->db_instance->conn);
            $istanza->workflow_id = $workflowModelId;
            $istanza->id_entita_associata = $data->id_entita_associata ?? null;
            $istanza->nome_entita_associata = $data->nome_entita_associata ?? null;
            $istanza->stato_istanza = 'IN_CORSO';

            if (!$istanza->create()) {
                throw new Exception("Impossibile creare l'istanza di workflow.");
            }

            // 3. Ricerca del Primo Passo del Workflow
            $step_model = new WorkflowStep($this->db_instance->conn);
            $primo_passo_array = $step_model->findAll(
                ['workflow_id' => $workflowModelId, 'ordine' => 1, 'sottopasso' => 1]
            );

            if (empty($primo_passo_array)) {
                throw new Exception("Il workflow non ha un primo passo definito (ordine 1, sottopasso 1).");
            }
            $primo_passo = $primo_passo_array[0];

            // 4. Creazione del Primo Task
            $primo_task = new Task($this->db_instance->conn);
            $primo_task->id_workflow = $workflowModelId;
            $primo_task->id_istanza_workflow = $istanza->id;
            $primo_task->nome = $primo_passo['nome_passo'];
            $primo_task->descrizione = $primo_passo['descrizione_passo'];
            $primo_task->id_stato = Task::STATO_APERTO;
            $primo_task->id_utente_assegnato = null;

            if (!$primo_task->create()) {
                throw new Exception("Impossibile creare il primo task per l'istanza di workflow.");
            }

            // Se tutto va bene, confermiamo
            $this->db_instance->conn->commit();

            $this->sendResponse(201, [
                "message" => "Istanza di workflow avviata con successo.",
                "id_istanza_creata" => $istanza->id,
                "id_primo_task" => $primo_task->id,
            ]);

        } catch (Exception $e) {
            // In caso di errore, annulliamo tutto
            $this->db_instance->conn->rollBack();
            $code = $e->getCode() > 0 ? $e->getCode() : 503;
            $this->sendResponse($code, ["message" => "Errore durante l'avvio del workflow: " . $e->getMessage()]);
        }
    }

    /**
     * Gestisce la lettura di una lista di risorse.
     * GET /api/{resource_name}
     */
    private function handleReadAll($model, string $resource_name)

    {
        $params = $_GET;
        unset($params['url']); // Rimuoviamo il parametro del router per non passarlo ai modelli

        // --- Logica Specifica per la Ricerca ---
        // Se la richiesta è per 'utenti' e c'è un parametro 'search', usiamo il metodo ottimizzato.
        if ($resource_name === 'utenti' && !empty($params['search'])) {
            // Il metodo search() si aspetta solo la stringa, non l'array
            $results = $model->search($params['search']);
        } // Altrimenti, usiamo il metodo findAll generico, che ora sa gestire i filtri.
        else {
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
        // Assegnazione sicura basata sui fillable_fields del modello.
        $fillable = $model->getFillableFields();
        foreach ($fillable as $field) {
            // Usiamo isset per controllare se la proprietà esiste nell'oggetto JSON ricevuto
            if (isset($data->$field)) {
                $model->{$field} = $data->$field;
            }
        }

        if ($model->create()) {
            $this->sendResponse(201, ["message" => "Record creato con successo.", "id_creato" => $model->id]);
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
            if (property_exists($model, $key)) {
                $model->{$key} = $value;
            }
        }
        if ($model->update()) {
            $this->sendResponse(200, ["message" => "Record aggiornato con successo."]);
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
            $this->sendResponse(200, ["message" => "Record cancellato con successo."]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile cancellare il record."]);
        }
    }

    private function handleAssignTask(int $taskId)
    {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data->user_id)) {
            $this->sendResponse(400, ["message" => "Dati non validi. Fornire 'user_id' nel corpo JSON."]);
            return;
        }
        $task = new Task($this->db_instance);
        if (!$task->find($taskId)) {
            $this->sendResponse(404, ["message" => "Task con ID {$taskId} non trovato."]);
            return;
        }
        if (!$task->assegnaUtente((int)$data->user_id)) {
            $this->sendResponse(409, ["message" => "Impossibile assegnare il task. Lo stato attuale potrebbe non essere 'Aperto'."]);
            return;
        }
        if ($task->update()) {
            $this->sendResponse(200, ["message" => "Task {$taskId} assegnato con successo all'utente {$data->user_id}."]);
        } else {
            $this->sendResponse(503, ["message" => "Errore durante il salvataggio dell'assegnazione."]);
        }
    }

    private function handleCompleteTask(int $taskId)
    {
        $task = new Task($this->db_instance);
        if (!$task->find($taskId)) {
            $this->sendResponse(404, ["message" => "Task con ID {$taskId} non trovato."]);
            return;
        }
        if (!$task->completaTask()) {
            $this->sendResponse(409, ["message" => "Impossibile completare il task. Deve essere nello stato 'In Lavorazione'."]);
            return;
        }
        if ($task->update()) {
            $this->sendResponse(200, ["message" => "Task completato con successo."]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile aggiornare il task nel database."]);
        }
    }

    private function getModelInstance(string $resource_name)
    {
        if (isset($this->model_map[$resource_name])) {
            $class_name = $this->model_map[$resource_name];
            // Assicurati che il file del modello sia stato incluso prima di usarlo
            if (!class_exists($class_name)) {
                $model_file = __DIR__ . '/../../models/' . $class_name . '.php';
                if (file_exists($model_file)) {
                    require_once $model_file;
                } else {
                    return null; // File non trovato
                }
            }
            return new $class_name($this->db_instance);
        }
        return null;
    }

    private function sendResponse(int $statusCode, $data)
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data);
    }
}