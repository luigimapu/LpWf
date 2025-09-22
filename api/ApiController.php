<?php
// Includiamo tutti i modelli qui, così sono sempre disponibili
require_once __DIR__ . '/../models/CrudBaseAbstract.php';
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Utente.php';
require_once __DIR__ . '/../models/Workflow.php';
require_once __DIR__ . '/../models/WorkflowStep.php';
require_once __DIR__ . '/../models/WorkflowIstanza.php';
require_once __DIR__ . '/../models/AzioneStandard.php';
require_once __DIR__ . '/../models/TaskNota.php';
require_once __DIR__ . '/../models/Gruppo.php';
require_once __DIR__ . '/../models/UtenteGruppo.php';
require_once __DIR__ . '/../models/TaskNotaAllegato.php';

class ApiController
{
    private $db_instance;
    private $request_method;

    private $model_map = [
        'tasks'          => 'Task',
        'utenti'         => 'Utente',
        'workflows'      => 'Workflow',
        'workflowsteps'  => 'WorkflowStep',
        'workflowistanze'=> 'WorkflowIstanza',
        'azioni'         => 'AzioneStandard',
        'gruppi'         => 'Gruppo',
    ];

    public function __construct(Database $database, string $method)
    {
        $this->db_instance = $database;
        $this->request_method = $method;
    }

    public function processRequest(?string $resource_name, ?int $id, ?string $action = null, ?int $extra_id = null)
    {
        if ($action) {
            $this->handleAction($resource_name, $id, $action, $extra_id);
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

    private function handleAction(?string $resource, ?int $id, ?string $action, ?int $extra_id = null)
    {
        if (!$id) {
            $this->sendResponse(400, ["message" => "ID risorsa mancante per l'azione."]);
            return;
        }

        if ($resource === 'workflows' && $action === 'start') {
            if ($this->request_method === 'POST') $this->handleStartInstance($id);
            else $this->sendResponse(405, ["message" => "Usare metodo POST per 'start'."]);
            return;
        }

        if ($resource === 'tasks') {
            switch($action) {
                case 'assign':
                    if ($this->request_method === 'PUT') $this->handleAssignTask($id);
                    else $this->sendResponse(405);
                    return;
                case 'complete':
                    if ($this->request_method === 'PUT') $this->handleCompleteTask($id);
                    else $this->sendResponse(405);
                    return;
                case 'note':
                    if ($this->request_method === 'GET') $this->handleGetTaskNotes($id);
                    else if ($this->request_method === 'POST') $this->handleAddTaskNote($id);
                    else $this->sendResponse(405);
                    return;
                case 'start_subflow':
                    if ($this->request_method === 'POST' && $extra_id) {
                        $this->handleStartSubflow($id, $extra_id);
                    } else {
                        $this->sendResponse(400, ["message" => "Metodo non valido o ID workflow mancante."]);
                    }
                    return;
            }
        }

        if ($resource === 'gruppi' && $extra_id) {
            switch ($action) {
                case 'add':
                    if ($this->request_method === 'POST') $this->addUserToGroup($id, $extra_id);
                    else $this->sendResponse(405);
                    return;
                case 'remove':
                    if ($this->request_method === 'DELETE') $this->removeUserFromGroup($id, $extra_id);
                    else $this->sendResponse(405);
                    return;
            }
        }

        $this->sendResponse(400, ["message" => "Azione '{$action}' non valida per la risorsa '{$resource}'."]);
    }

    private function handleReadAll($model, $resource_name) {
        $params = $_GET;
        if (isset($params['url'])) unset($params['url']);
        $results = $model->findAll($params);
        $this->sendResponse(200, $results);
    }

    private function handleReadOne($model, int $id) {
        if ($model instanceof Workflow) {
            if(!$model->findWithSteps($id)) { $this->sendResponse(404, ["message" => "Workflow non trovato."]); return; }
        } elseif ($model instanceof WorkflowIstanza) {
            if(!$model->findWithDetails($id)) { $this->sendResponse(404, ["message" => "Istanza non trovata."]); return; }
        } elseif ($model instanceof Gruppo) {
            if(!$model->findWithUsers($id)) { $this->sendResponse(404, ["message" => "Gruppo non trovato."]); return; }
        } elseif (!$model->find($id)) {
            $this->sendResponse(404, ["message" => "Record non trovato."]); return;
        }
        $this->sendResponse(200, $model->toArray());
    }

    private function handleCreate($model) {
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) { $this->sendResponse(400, ["message" => "Dati JSON non validi."]); return; }

        $fillable = $model->getFillableFields();
        foreach ($data as $key => $value) {
            if (in_array($key, $fillable)) {
                $model->{$key} = $value;
            }
        }

        if ($model->create()) {
            $this->sendResponse(201, ["message" => "Record creato con successo.", "id" => $model->id]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile creare il record."]);
        }
    }

    private function handleUpdate($model, int $id) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) { $this->sendResponse(400, ["message" => "Dati JSON non validi."]); return; }
        if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }

        if ($model->update($data)) {
            $this->sendResponse(200, ["message" => "Record aggiornato con successo."]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile aggiornare il record."]);
        }
    }

    private function handleDelete($model, int $id) {
        if (!property_exists($model, 'attivo')) {
            if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
            if ($model->delete()) { $this->sendResponse(200, ["message" => "Record cancellato fisicamente."]); }
            else { $this->sendResponse(503, ["message" => "Impossibile cancellare il record."]); }
        } else {
            if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
            if ($model->update(['attivo' => 0])) { $this->sendResponse(200, ["message" => "Record disattivato."]); }
            else { $this->sendResponse(503, ["message" => "Impossibile aggiornare lo stato."]); }
        }
    }

    private function handleStartInstance(int $workflowModelId) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->id_utente_avvio)) { $this->sendResponse(400, ["message" => "ID utente avvio mancante."]); return; }

        try {
            $this->db_instance->conn->beginTransaction();
            $workflow_model = new Workflow($this->db_instance);
            if (!$workflow_model->find($workflowModelId)) throw new Exception("Modello workflow non trovato.", 404);

            $istanza = new WorkflowIstanza($this->db_instance);
            $istanza->workflow_id = $workflowModelId;
            $istanza->id_entita_associata = $data->id_entita_associata ?? null;
            $istanza->nome_entita_associata = $data->nome_entita_associata ?? null;
            $istanza->stato_istanza = 'IN_CORSO';
            $istanza->id_utente_avvio = (int)$data->id_utente_avvio;
            if (!$istanza->create()) throw new Exception("Impossibile creare istanza.");

            $step_model = new WorkflowStep($this->db_instance);
            $primi_passi = $step_model->findAll(['workflow_id' => $workflowModelId, 'ordine' => 1]);
            if (empty($primi_passi)) throw new Exception("Nessun primo passo definito per questo workflow.");

            foreach ($primi_passi as $passo) {
                $task = new Task($this->db_instance);
                $id_utente_da_assegnare = $this->findUserForTask($istanza->id, $passo['id_gruppo_responsabile']);

                $task->nome = $passo['nome_passo'];
                $task->descrizione = $passo['descrizione_passo'];
                $task->id_workflow = $workflowModelId;
                $task->workflow_step_id = $passo['id'];
                $task->id_istanza_workflow = $istanza->id;
                $task->id_utente_assegnato = $id_utente_da_assegnare;
                $task->id_stato = $id_utente_da_assegnare ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
                if (!$task->create()) throw new Exception("Impossibile creare task per il passo {$passo['id']}.");
            }
            $this->db_instance->conn->commit();
            $this->sendResponse(201, ["message" => "Istanza avviata con successo."]);
        } catch (Exception $e) {
            $this->db_instance->conn->rollBack();
            $this->sendResponse(503, ["message" => "Errore durante l'avvio del workflow: " . $e->getMessage()]);
        }
    }

    private function handleStartSubflow(int $parentTaskId, int $subflowWorkflowId)
    {
        try {
            $parentTask = new Task($this->db_instance);
            if (!$parentTask->find($parentTaskId)) throw new Exception("Task genitore non trovato.", 404);
            if ($parentTask->id_stato != Task::STATO_IN_LAVORAZIONE) throw new Exception("Un sottoprocesso può essere avviato solo da un task 'In Gestione'.", 409);

            $id_istanza_padre = $parentTask->id_istanza_workflow;
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id_utente_avvio)) { $this->sendResponse(400, ["message" => "ID utente avvio mancante."]); return; }

            $this->db_instance->beginTransaction();

            $istanza = new WorkflowIstanza($this->db_instance);
            $istanza->workflow_id = $subflowWorkflowId;
            $istanza->id_istanza_padre = $id_istanza_padre;
            $istanza->nome_entita_associata = "Sottoprocesso del Task #" . $parentTaskId;
            $istanza->id_utente_avvio = (int)$data->id_utente_avvio;
            $istanza->stato_istanza = 'IN_CORSO';
            if (!$istanza->create()) throw new Exception("Impossibile creare l'istanza del sottoprocesso.");

            $nuova_istanza_id = $istanza->id;

            $step_model = new WorkflowStep($this->db_instance);
            $primi_passi = $step_model->findAll(['workflow_id' => $subflowWorkflowId, 'ordine' => 1]);
            if (empty($primi_passi)) throw new Exception("Il workflow del sottoprocesso non ha un primo passo definito.");

            foreach ($primi_passi as $passo) {
                $task = new Task($this->db_instance);
                $id_utente_da_assegnare = $this->findUserForTask($nuova_istanza_id, $passo['id_gruppo_responsabile']);
                if (isset($data->assegna_a_utente_id) && !empty($data->assegna_a_utente_id)) $id_utente_da_assegnare = $data->assegna_a_utente_id;

                $task->nome = $passo['nome_passo'];
                $task->id_workflow = $subflowWorkflowId;
                $task->workflow_step_id = $passo['id'];
                $task->id_istanza_workflow = $nuova_istanza_id;
                $task->id_utente_assegnato = $id_utente_da_assegnare;
                $task->id_stato = $id_utente_da_assegnare ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
                if (!$task->create()) throw new Exception("Impossibile creare il task del sottoprocesso.");
            }

            $this->db_instance->commit();
            $this->sendResponse(201, ["message" => "Sottoprocesso avviato.", "id_nuova_istanza" => $nuova_istanza_id]);

        } catch (Exception $e) {
            $this->db_instance->rollBack();
            $this->sendResponse($e->getCode() > 0 ? $e->getCode() : 503, ["message" => $e->getMessage()]);
        }
    }

    private function handleAssignTask(int $taskId) {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->user_id)) { $this->sendResponse(400, ["message" => "'user_id' mancante."]); return; }

        $task = new Task($this->db_instance);
        if (!$task->find($taskId)) { $this->sendResponse(404, ["message" => "Task non trovato."]); return; }

        if (!$task->assegnaUtente((int)$data->user_id)) { $this->sendResponse(409, ["message" => "Impossibile assegnare il task (probabilmente non è aperto)."]); return; }

        if ($task->update(['id_utente_assegnato' => $task->id_utente_assegnato, 'id_stato' => $task->id_stato])) {
            $this->sendResponse(200, ["message" => "Task assegnato."]);
        } else {
            $this->sendResponse(503, ["message" => "Errore durante il salvataggio dell'assegnazione."]);
        }
    }

    private function handleCompleteTask(int $taskId) {
        try {
            $this->db_instance->conn->beginTransaction();
            $task_corrente = new Task($this->db_instance);
            if (!$task_corrente->find($taskId)) throw new Exception("Task non trovato.", 404);
            if (!$task_corrente->completaTask()) throw new Exception("Impossibile completare. Stato non è 'In Lavorazione'.", 409);
            if (!$task_corrente->update(['id_stato' => $task_corrente->id_stato])) throw new Exception("Errore nel salvataggio dello stato 'Completato'.");

            if (empty($task_corrente->workflow_step_id)) {
                $this->db_instance->conn->commit();
                $this->sendResponse(200, ["message" => "Task manuale completato."]); return;
            }

            $step_corrente = new WorkflowStep($this->db_instance);
            if (!$step_corrente->find($task_corrente->workflow_step_id)) throw new Exception("Passo del workflow non trovato (ID: {$task_corrente->workflow_step_id}).");

            $query_check = "SELECT COUNT(t.id) as pending_tasks FROM task t WHERE t.id_istanza_workflow = ? AND t.id != ? AND t.id_stato != ? AND t.workflow_step_id IN (SELECT id FROM workflow_steps WHERE ordine = ? AND workflow_id = ?)";
            $check_pending = $this->db_instance->selectOne($query_check, [$task_corrente->id_istanza_workflow, $taskId, Task::STATO_CHIUSO, $step_corrente->ordine, $task_corrente->id_workflow]);

            if ($check_pending && $check_pending['pending_tasks'] > 0 && !$step_corrente->avanzamento_automatico) {
                $this->db_instance->conn->commit();
                $this->sendResponse(200, ["message" => "Task completato. In attesa di altri passi paralleli."]); return;
            }

            $step_successivo = new WorkflowStep($this->db_instance);
            $passi_successivi = $step_successivo->findAll(['workflow_id' => $task_corrente->id_workflow, 'ordine' => $step_corrente->ordine + 1], 'sottopasso ASC');

            if (empty($passi_successivi)) {
                $istanza = new WorkflowIstanza($this->db_instance);
                if ($istanza->find($task_corrente->id_istanza_workflow)) {
                    $istanza->update(['stato_istanza' => 'COMPLETATO', 'data_completamento' => date('Y-m-d H:i:s')]);
                }
                $messaggio_successo = "Task completato. Workflow terminato!";
            } else {
                foreach($passi_successivi as $passo) {
                    $nuovo_task = new Task($this->db_instance);
                    $id_utente_da_assegnare = $this->findUserForTask($task_corrente->id_istanza_workflow, $passo['id_gruppo_responsabile']);
                    $nuovo_task->nome = $passo['nome_passo'];
                    $nuovo_task->descrizione = $passo['descrizione_passo'];
                    $nuovo_task->id_workflow = $task_corrente->id_workflow;
                    $nuovo_task->id_istanza_workflow = $task_corrente->id_istanza_workflow;
                    $nuovo_task->workflow_step_id = $passo['id'];
                    $nuovo_task->id_utente_assegnato = $id_utente_da_assegnare;
                    $nuovo_task->id_stato = $id_utente_da_assegnare ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
                    if (!$nuovo_task->create()) throw new Exception("Impossibile creare task successivo (Step ID: {$passo['id']}).");
                }
                $messaggio_successo = "Task completato. Creati " . count($passi_successivi) . " task successivi.";
            }
            $this->db_instance->conn->commit();
            $this->sendResponse(200, ["message" => $messaggio_successo]);
        } catch (Exception $e) {
            $this->db_instance->conn->rollBack();
            $this->sendResponse(503, ["message" => "Errore: " . $e->getMessage()]);
        }
    }

    private function findUserForTask(int $id_istanza, ?int $id_gruppo): ?int {
        if (is_null($id_gruppo)) return null;
        $sql_continuity = "SELECT t.id_utente_assegnato FROM task t JOIN utenti_gruppi ug ON t.id_utente_assegnato = ug.id_utente WHERE t.id_istanza_workflow = ? AND ug.id_gruppo = ? AND t.id_utente_assegnato IS NOT NULL ORDER BY t.data_aggiornamento DESC LIMIT 1";
        $result = $this->db_instance->selectOne($sql_continuity, [$id_istanza, $id_gruppo]);
        if ($result && !empty($result['id_utente_assegnato'])) return (int) $result['id_utente_assegnato'];

        $sql_load_balance = "SELECT ug.id_utente, COUNT(t.id) AS task_count FROM utenti_gruppi ug LEFT JOIN task t ON ug.id_utente = t.id_utente_assegnato AND t.id_stato != ? WHERE ug.id_gruppo = ? GROUP BY ug.id_utente ORDER BY task_count ASC, RAND() LIMIT 1";
        $result = $this->db_instance->selectOne($sql_load_balance, [Task::STATO_CHIUSO, $id_gruppo]);
        if ($result && isset($result['id_utente'])) return (int) $result['id_utente'];
        return null;
    }

    private function addUserToGroup(int $groupId, int $userId) {
        $userGroup = new UtenteGruppo($this->db_instance);
        $userGroup->id_gruppo = $groupId;
        $userGroup->id_utente = $userId;
        if ($userGroup->create()) $this->sendResponse(201, ["message" => "Utente aggiunto."]);
        else $this->sendResponse(409, ["message" => "Utente già presente o errore."]);
    }

    private function removeUserFromGroup(int $groupId, int $userId) {
        $sql = "DELETE FROM utenti_gruppi WHERE id_gruppo = ? AND id_utente = ?";
        $rowCount = $this->db_instance->executeStatement($sql, [$groupId, $userId]);
        if ($rowCount > 0) $this->sendResponse(200, ["message" => "Utente rimosso."]);
        else $this->sendResponse(404, ["message" => "Relazione non trovata."]);
    }

    private function handleGetTaskNotes(int $taskId) {
        $noteModel = new TaskNota($this->db_instance);
        $notes = $noteModel->findAll(['id_task' => $taskId]);
        $this->sendResponse(200, $notes);
    }

    private function handleAddTaskNote(int $taskId) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->nota) || empty($data->id_utente)) { $this->sendResponse(400, ["message" => "Testo della nota e utente sono obbligatori."]); return; }

        $this->db_instance->beginTransaction();
        try {
            $note = new TaskNota($this->db_instance);
            $note->id_task = $taskId;
            $note->id_utente = (int)$data->id_utente;
            $note->nota = htmlspecialchars(strip_tags($data->nota));
            if (!$note->create()) throw new Exception("Impossibile salvare la nota.");

            $this->db_instance->commit();
            $this->sendResponse(201, ["message" => "Nota aggiunta."]);
        } catch (Exception $e) {
            $this->db_instance->rollBack();
            $this->sendResponse(503, ["message" => "Errore salvataggio nota: " . $e->getMessage()]);
        }
    }

    private function getModelInstance(string $resource_name) {
        if (isset($this->model_map[$resource_name])) {
            $class_name = $this->model_map[$resource_name];
            if (class_exists($class_name)) return new $class_name($this->db_instance);
        }
        return null;
    }

    private function sendResponse(int $statusCode, $data) {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}