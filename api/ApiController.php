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
require_once __DIR__ . '/../models/UserRoleAudit.php';
require_once __DIR__ . '/../models/AuthAudit.php';
require_once __DIR__ . '/../models/SupervisorUtente.php';
require_once __DIR__ . '/../models/TaskNotaAllegato.php';
require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../models/ServiceLog.php';
require_once __DIR__ . '/../models/Ticket.php';
require_once __DIR__ . '/../models/TicketComment.php';
require_once __DIR__ . '/../services/ServiceDispatcher.php';
require_once __DIR__ . '/../services/ActionExecutor.php';
require_once __DIR__ . '/../config/HubDatabase.php';

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
        'audit_roles'    => 'UserRoleAudit',
        'auth_audit'     => 'AuthAudit',
        'clienti'        => 'Cliente',
        'service_logs'   => 'ServiceLog',
        'tickets'        => 'Ticket',
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
                case 'note_attach':
                    if ($this->request_method !== 'POST') { $this->sendResponse(405); return; }
                    $this->handleAddTaskNoteAttachment($id);
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

        if ($resource === 'tickets') {
            switch ($action) {
                case 'assign':
                    if ($this->request_method === 'PUT') { $this->handleAssignTicket($id); } else { $this->sendResponse(405); }
                    return;
                case 'close':
                    if ($this->request_method === 'PUT') { $this->handleCloseTicket($id); } else { $this->sendResponse(405); }
                    return;
                case 'reopen':
                    if ($this->request_method === 'PUT') { $this->handleReopenTicket($id); } else { $this->sendResponse(405); }
                    return;
                case 'comment':
                    if ($this->request_method === 'GET') { $this->handleGetTicketComments($id); }
                    else if ($this->request_method === 'POST') { $this->handleAddTicketComment($id); }
                    else { $this->sendResponse(405); }
                    return;
                case 'comment_attach':
                    if ($this->request_method === 'POST') { $this->handleAddTicketCommentAttachment($id); } else { $this->sendResponse(405); }
                    return;
                case 'attachments':
                    if ($this->request_method === 'GET') { $this->handleGetTicketAttachments($id); } else { $this->sendResponse(405); }
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

        if ($resource === 'utenti' && $action === 'groups') {
            if ($this->request_method !== 'GET') { $this->sendResponse(405, ["message" => "Metodo non consentito."]); return; }
            $sql = "SELECT g.* FROM gruppi g JOIN utenti_gruppi ug ON ug.gruppo_id = g.id WHERE ug.utente_id = ?";
            $rows = $this->db_instance->select($sql, [$id]) ?: [];
            $this->sendResponse(200, $rows);
            return;
        }

        // Associazioni Supervisor -> Users
        if ($resource === 'utenti') {
            switch ($action) {
                case 'supervised':
                    if ($this->request_method !== 'GET') { $this->sendResponse(405); return; }
                    $sql = "SELECT u.id, u.nome, u.cognome, u.email, u.ruolo FROM utenti u
                            JOIN supervisori_utenti su ON su.user_id = u.id
                            WHERE su.supervisor_id = ?";
                    $rows = $this->db_instance->select($sql, [$id]) ?: [];
                    $this->sendResponse(200, $rows);
                    return;
                case 'add_supervised':
                    if ($this->request_method !== 'POST' || !$extra_id) { $this->sendResponse(405); return; }
                    $currentUser = $_SERVER['AUTH_USER'] ?? null;
                    $role = strtoupper($currentUser['ruolo'] ?? '');
                    if (!in_array($role, ['ADMIN','SUPERVISOR'], true)) { $this->sendResponse(403, ["message"=>"Permesso negato."]); return; }
                    if ($role === 'SUPERVISOR' && (int)$currentUser['id'] !== (int)$id) { $this->sendResponse(403, ["message"=>"Un supervisor può associare solo i propri utenti."]); return; }
                    $su = new SupervisorUtente($this->db_instance);
                    $su->supervisor_id = $id;
                    $su->user_id = $extra_id;
                    if ($su->create()) $this->sendResponse(201, ["message" => "Associazione creata."]);
                    else $this->sendResponse(409, ["message" => "Già associato o errore."]);
                    return;
                case 'remove_supervised':
                    if ($this->request_method !== 'DELETE' || !$extra_id) { $this->sendResponse(405); return; }
                    $currentUser = $_SERVER['AUTH_USER'] ?? null;
                    $role = strtoupper($currentUser['ruolo'] ?? '');
                    if (!in_array($role, ['ADMIN','SUPERVISOR'], true)) { $this->sendResponse(403, ["message"=>"Permesso negato."]); return; }
                    if ($role === 'SUPERVISOR' && (int)$currentUser['id'] !== (int)$id) { $this->sendResponse(403, ["message"=>"Un supervisor può disassociare solo i propri utenti."]); return; }
                    $sql = "DELETE FROM supervisori_utenti WHERE supervisor_id = ? AND user_id = ?";
                    $cnt = $this->db_instance->executeStatement($sql, [$id, $extra_id]);
                    if ($cnt > 0) $this->sendResponse(200, ["message" => "Associazione rimossa."]);
                    else $this->sendResponse(404, ["message" => "Associazione non trovata."]);
                    return;
                case 'supervisors':
                    if ($this->request_method !== 'GET') { $this->sendResponse(405); return; }
                    $sql = "SELECT u.id, u.nome, u.cognome, u.email, u.ruolo FROM utenti u
                            JOIN supervisori_utenti su ON su.supervisor_id = u.id
                            WHERE su.user_id = ?";
                    $rows = $this->db_instance->select($sql, [$id]) ?: [];
                    $this->sendResponse(200, $rows);
                    return;
                case 'set_supervisor':
                    if ($this->request_method !== 'POST') { $this->sendResponse(405); return; }
                    $currentUser = $_SERVER['AUTH_USER'] ?? null;
                    $role = strtoupper($currentUser['ruolo'] ?? '');
                    if (!in_array($role, ['ADMIN','SUPERVISOR'], true)) { $this->sendResponse(403, ["message"=>"Permesso negato."]); return; }
                    if ($role === 'SUPERVISOR' && (int)$currentUser['id'] !== (int)$extra_id) { $this->sendResponse(403, ["message"=>"Un supervisor può impostare solo se stesso."]); return; }
                    // reset mapping and set new
                    $this->db_instance->executeStatement("DELETE FROM supervisori_utenti WHERE user_id = ?", [$id]);
                    $supId = (int)$extra_id;
                    if ($supId > 0) {
                        $su = new SupervisorUtente($this->db_instance);
                        $su->supervisor_id = $supId;
                        $su->user_id = $id;
                        $su->create();
                    }
                    $this->sendResponse(200, ["message"=>"Supervisor aggiornato."]);
                    return;
            }
        }

        $this->sendResponse(400, ["message" => "Azione '{$action}' non valida per la risorsa '{$resource}'."]);
    }

    private function handleReadAll($model, $resource_name) {
        $params = $_GET;
        if (isset($params['url'])) unset($params['url']);

        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN', 'SUPERVISOR'], true);

        if ($resource_name === 'tasks' && $currentUser) {
            $unassigned = isset($params['unassigned']) && filter_var($params['unassigned'], FILTER_VALIDATE_BOOLEAN);
            if (!$isAdmin && !$unassigned) {
                $params['id_utente_assegnato'] = $params['id_utente_assegnato'] ?? $currentUser['id'];
            }
        }

        if ($resource_name === 'workflowistanze' && $currentUser && !$isAdmin) {
            $params['visible_for_user_id'] = $currentUser['id'];
        }

        if ($model instanceof Utente) {
            $results = $model->findAll($params);

            // Opzionale: includi gruppi per utente se richiesto
            $withGroups = isset($params['with_groups']) && filter_var($params['with_groups'], FILTER_VALIDATE_BOOLEAN);
            $groupsMap = [];
            if ($withGroups && count($results) > 0) {
                $ids = array_map(fn($u) => (int)$u['id'], $results);
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $sql = "SELECT ug.utente_id, g.*
                        FROM utenti_gruppi ug
                        JOIN gruppi g ON g.id = ug.gruppo_id
                        WHERE ug.utente_id IN ($placeholders)";
                $rows = $this->db_instance->select($sql, $ids) ?: [];
                foreach ($rows as $row) {
                    $uid = (int)$row['utente_id'];
                    unset($row['utente_id']);
                    $groupsMap[$uid] = $groupsMap[$uid] ?? [];
                    $groupsMap[$uid][] = $row;
                }
            }

            // Opzionale: includi supervisor per utente
            $withSupervisors = isset($params['with_supervisors']) && filter_var($params['with_supervisors'], FILTER_VALIDATE_BOOLEAN);
            $supMap = [];
            if ($withSupervisors && count($results) > 0) {
                $ids = array_map(fn($u) => (int)$u['id'], $results);
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $sql = "SELECT su.user_id, s.id, s.nome, s.cognome, s.email, s.ruolo
                        FROM supervisori_utenti su
                        JOIN utenti s ON s.id = su.supervisor_id
                        WHERE su.user_id IN ($placeholders)";
                $rows = $this->db_instance->select($sql, $ids) ?: [];
                foreach ($rows as $row) {
                    $uid = (int)$row['user_id'];
                    unset($row['user_id']);
                    $supMap[$uid] = $supMap[$uid] ?? [];
                    $supMap[$uid][] = $row;
                }
            }

            // Build payload masking password
            $clean = array_map(function ($row) use ($withGroups, $groupsMap, $withSupervisors, $supMap) {
                unset($row['password_hash']);
                if ($withGroups) {
                    $row['gruppi'] = $groupsMap[(int)$row['id']] ?? [];
                }
                if ($withSupervisors) {
                    $row['supervisors'] = $supMap[(int)$row['id']] ?? [];
                }
                return $row;
            }, $results);

            $payload = [
                'count' => count($clean),
                'utenti' => $clean,
            ];
            $this->sendResponse(200, $payload);
            return;
        }

        // Gruppi: opzionale conteggio utenti per filtro client
        if ($model instanceof Gruppo) {
            // Ignora i parametri query non di colonna (es. with_user_counts) per evitare WHERE non validi
            $results = $model->findAll();
            $withCounts = isset($params['with_user_counts']) && filter_var($params['with_user_counts'], FILTER_VALIDATE_BOOLEAN);
            if ($withCounts && count($results) > 0) {
                $ids = array_map(fn($g) => (int)$g['id'], $results);
                if (count($ids)) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $sql = "SELECT ug.gruppo_id AS id, COUNT(*) AS users_count
                            FROM utenti_gruppi ug
                            WHERE ug.gruppo_id IN ($placeholders)
                            GROUP BY ug.gruppo_id";
                    $rows = $this->db_instance->select($sql, $ids) ?: [];
                    $map = [];
                    foreach ($rows as $r) { $map[(int)$r['id']] = (int)$r['users_count']; }
                    foreach ($results as &$g) { $g['users_count'] = $map[(int)$g['id']] ?? 0; }
                }
            }
            $this->sendResponse(200, $results);
            return;
        }

        if ($model instanceof UserRoleAudit) {
            $limit = isset($params['limit']) && is_numeric($params['limit']) ? (int)$params['limit'] : 0;
            if ($limit > 0) {
                // Ottimizzato con LIMIT se richiesto
                if ($limit > 1000) { $limit = 1000; }
                $sql = "SELECT * FROM user_role_audit ORDER BY changed_at DESC LIMIT $limit";
                $rows = $this->db_instance->select($sql, []) ?: [];
                $this->sendResponse(200, $rows);
                return;
            } else {
                $results = $model->findAll([], 'changed_at DESC');
                $this->sendResponse(200, $results);
                return;
            }
        }
        if ($model instanceof AuthAudit) {
            $limit = isset($params['limit']) && is_numeric($params['limit']) ? (int)$params['limit'] : 200;
            if ($limit < 1) { $limit = 200; }
            if ($limit > 1000) { $limit = 1000; }
            // Ottimizzato: usa LIMIT direttamente in SQL invece di caricare tutto
            $sql = "SELECT * FROM auth_audit ORDER BY created_at DESC LIMIT $limit";
            $rows = $this->db_instance->select($sql, []) ?: [];
            $this->sendResponse(200, $rows);
            return;
        }

        // Tickets: se non ADMIN, mostra solo visibili all'utente corrente
        if ($model instanceof Ticket) {
            $currentUser = $_SERVER['AUTH_USER'] ?? null;
            $role = strtoupper($currentUser['ruolo'] ?? '');
            $isAdmin = in_array($role, ['ADMIN','SUPERVISOR'], true);
            // supporta ?mine=true per forzare il filtro a utente corrente
            $mine = isset($params['mine']) && filter_var($params['mine'], FILTER_VALIDATE_BOOLEAN);
            if (!$isAdmin || $mine) {
                $params['visible_for_user_id'] = (int)($currentUser['id'] ?? 0);
            }
            // supporta ?team=1 per supervisor/admin: mostra i ticket del team
            $team = isset($params['team']) && filter_var($params['team'], FILTER_VALIDATE_BOOLEAN);
            if ($team && $isAdmin) {
                $params['team_of_supervisor_id'] = (int)($currentUser['id'] ?? 0);
            }
        }

        $results = $model->findAll($params);
        $this->sendResponse(200, $results);
    }

    private function handleReadOne($model, int $id) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN', 'SUPERVISOR'], true);

        if ($model instanceof Workflow) {
            if(!$model->findWithSteps($id)) { $this->sendResponse(404, ["message" => "Workflow non trovato."]); return; }
        } elseif ($model instanceof WorkflowIstanza) {
            if(!$model->findWithDetails($id)) { $this->sendResponse(404, ["message" => "Istanza non trovata."]); return; }
            if ($currentUser && !$isAdmin) {
                $userId = (int)$currentUser['id'];
                $isOwner = ((int)$model->avviato_da === $userId);
                $hasAssignment = $model->utenteCoinvolto($userId);
                if (!$isOwner && !$hasAssignment) {
                    $this->sendResponse(403, ["message" => "Accesso negato alla istanza richiesta."]); return;
                }
            }
        } elseif ($model instanceof Gruppo) {
            if(!$model->findWithUsers($id)) { $this->sendResponse(404, ["message" => "Gruppo non trovato."]); return; }
        } elseif ($model instanceof Utente) {
            if(!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
            // Non esporre mai l'hash della password
            $this->sendResponse(200, $model->toPublicArray());
            return;
        } elseif (!$model->find($id)) {
            $this->sendResponse(404, ["message" => "Record non trovato."]); return;
        }
        $this->sendResponse(200, $model->toArray());
    }

    private function handleCreate($model) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($currentUser['ruolo'] ?? '');
        if (($model instanceof Utente || $model instanceof Gruppo) && $role !== 'ADMIN') {
            $this->sendResponse(403, ["message" => "Solo ADMIN può eseguire l'operazione richiesta."]); return;
        }
        $data = json_decode(file_get_contents("php://input"));
        if (json_last_error() !== JSON_ERROR_NONE) { $this->sendResponse(400, ["message" => "Dati JSON non validi."]); return; }

        if ($model instanceof WorkflowStep) {
            if (isset($data->azione_id) && !isset($data->tipo_azione_standard)) {
                $data->tipo_azione_standard = $data->azione_id;
            }
            if (isset($data->workflow_id) && !isset($data->workflow_modello_id)) {
                $data->workflow_modello_id = $data->workflow_id;
            }
            if (isset($data->descrizione_passo) && !isset($data->descrizione)) {
                $data->descrizione = $data->descrizione_passo;
            }
            if (isset($data->scadenza_standard_valore) && $data->scadenza_standard_valore === '') {
                $data->scadenza_standard_valore = null;
                $data->scadenza_standard_unita = null;
            }
            if (empty($data->responsabile_utente_id) && empty($data->responsabile_gruppo_id)) {
                $this->sendResponse(400, ['message' => 'Specificare un responsabile utente o un gruppo per il passo.']);
                return;
            }
        }

        // Normalizzazioni specifiche per modello
        if ($model instanceof Gruppo) {
            if (isset($data->nome_gruppo) && !isset($data->nome)) {
                $data->nome = $data->nome_gruppo;
            }
        }

        // Normalizzazioni specifiche per modello
        if ($model instanceof Gruppo) {
            if (isset($data->nome_gruppo) && !isset($data->nome)) {
                $data->nome = $data->nome_gruppo;
            }
        }
        if ($model instanceof Utente) {
            if (isset($data->password) && $data->password !== '') {
                $model->password_hash = password_hash((string)$data->password, PASSWORD_BCRYPT);
                unset($data->password);
            }
        }

        // Cliente: lookup/normalizzazione su hub, con precompilazione e link
        if ($model instanceof Cliente) {
            $hubId = null;
            $tenantId = getenv('TENANT_ID') ?: null;
            $piva = isset($data->partita_iva) ? trim((string)$data->partita_iva) : '';
            $cf = isset($data->codice_fiscale) ? trim((string)$data->codice_fiscale) : '';
            try {
                $hub = new HubDatabase();
                // Cerca su hub per P.IVA o CF
                $found = null;
                if ($piva !== '') {
                    $found = $hub->selectOne('SELECT * FROM clienti WHERE partita_iva = ? LIMIT 1', [$piva]);
                }
                if (!$found && $cf !== '') {
                    $found = $hub->selectOne('SELECT * FROM clienti WHERE codice_fiscale = ? LIMIT 1', [$cf]);
                }
                // Opzionale: dedup "soft" via email/telefono se abilitato e nessun match rigido
                if (!$found) {
                    $soft = getenv('HUB_CLIENTI_SOFT_DEDUP') ?: '';
                    $softEnabled = ($soft === '1' || strtolower($soft) === 'true');
                    $email = isset($data->email) ? trim((string)$data->email) : '';
                    $tel = isset($data->telefono) ? trim((string)$data->telefono) : '';
                    if ($softEnabled && ($email !== '' || $tel !== '')) {
                        $ids = [];
                        if ($email !== '') {
                            $rows = $hub->select('SELECT id, ragione_sociale, email, telefono FROM clienti WHERE email = ? LIMIT 5', [$email]);
                            foreach ($rows as $r) { $ids[(int)$r['id']] = $r; }
                        }
                        if ($tel !== '') {
                            $rows = $hub->select('SELECT id, ragione_sociale, email, telefono FROM clienti WHERE telefono = ? LIMIT 5', [$tel]);
                            foreach ($rows as $r) { $ids[(int)$r['id']] = $r + ['id' => (int)$r['id']]; }
                        }
                        if (count($ids) === 1) {
                            $only = array_values($ids)[0];
                            $found = $hub->selectOne('SELECT * FROM clienti WHERE id = ? LIMIT 1', [$only['id']]);
                        }
                        // Se >1 candidati, ambiguità: non colleghiamo automaticamente.
                    }
                }
                if ($found) {
                    $hubId = (int)$found['id'];
                    // Precompila i campi mancanti con dati hub
                    $prefillKeys = ['ragione_sociale','email','telefono','indirizzo','cap','citta','provincia','nazione','tipo_cliente','partita_iva','codice_fiscale'];
                    foreach ($prefillKeys as $k) {
                        if ((!isset($data->{$k}) || $data->{$k} === '' || $data->{$k} === null) && isset($found[$k]) && $found[$k] !== null && $found[$k] !== '') {
                            $data->{$k} = $found[$k];
                        }
                    }
                } else {
                    // Crea su hub un nuovo cliente
                    $hKeys = ['ragione_sociale','partita_iva','codice_fiscale','email','telefono','indirizzo','cap','citta','provincia','nazione','tipo_cliente'];
                    $cols = [];$ph=[];$vals=[];
                    foreach ($hKeys as $k) {
                        if (isset($data->{$k}) && $data->{$k} !== '') { $cols[] = $k; $ph[]='?'; $vals[] = $data->{$k}; }
                    }
                    if (!in_array('ragione_sociale', $cols, true)) {
                        // Richiede ragione_sociale (garantito a livello API), altrimenti uso placeholder
                        $cols[] = 'ragione_sociale'; $ph[]='?'; $vals[] = (isset($data->ragione_sociale) ? (string)$data->ragione_sociale : '');
                    }
                    $sql = 'INSERT INTO clienti (' . implode(', ', $cols) . ', creato_il, aggiornato_il) VALUES (' . implode(', ', $ph) . ', NOW(), NOW())';
                    try {
                        $hub->executeStatement($sql, $vals);
                        $hubId = (int)$hub->lastInsertId();
                    } catch (Throwable $e) {
                        // In caso di dup key su piva/cf, riprova lookup
                        if ($piva !== '') { $row = $hub->selectOne('SELECT * FROM clienti WHERE partita_iva = ? LIMIT 1', [$piva]); if ($row) { $hubId = (int)$row['id']; } }
                        if (!$hubId && $cf !== '') { $row = $hub->selectOne('SELECT * FROM clienti WHERE codice_fiscale = ? LIMIT 1', [$cf]); if ($row) { $hubId = (int)$row['id']; } }
                    }
                }
            } catch (Throwable $e) {
                // Config hub mancante o errore: continua senza bloccare la creazione locale
                $hubId = null;
            }

        }

        $fillable = $model->getFillableFields();
        foreach ($data as $key => $value) {
            if (in_array($key, $fillable)) {
                $model->{$key} = $value;
            }
        }
        if ($model instanceof Cliente && isset($hubId) && $hubId) {
            // Assicura che il link hub non venga sovrascritto dal payload
            $model->hub_cliente_id = $hubId;
        }

        // Set automatismi per Ticket: utente creatore e stato default
        if ($model instanceof Ticket) {
            $currentUser = $_SERVER['AUTH_USER'] ?? null;
            if ($currentUser && empty($model->creato_da)) {
                $model->creato_da = (int)$currentUser['id'];
            }
            if (empty($model->stato)) { $model->stato = 'APERTO'; }
        }

        if ($model->create()) {
            // Se cliente, registra mapping su hub (best effort)
            if ($model instanceof Cliente && !empty($model->hub_cliente_id)) {
                try {
                    $tenantId = getenv('TENANT_ID') ?: null;
                    if ($tenantId) {
                        $hub = new HubDatabase();
                        $hub->executeStatement(
                            'INSERT INTO clienti_tenant_map (cliente_id, tenant_id, cliente_id_tenant, creato_il) VALUES (?, ?, ?, NOW())',
                            [ (int)$model->hub_cliente_id, (int)$tenantId, (string)$model->id ]
                        );
                    }
                } catch (Throwable $e) { /* ignore mapping errors */ }
            }
            // Risposta dedicata per Cliente: include stato link a Hub
            if ($model instanceof Cliente) {
                $this->sendResponse(201, [
                    'message' => 'Record creato con successo.',
                    'id' => (int)$model->id,
                    'link_hub' => !empty($model->hub_cliente_id),
                    'hub_cliente_id' => isset($model->hub_cliente_id) ? (int)$model->hub_cliente_id : 0,
                ]);
                return;
            }
            // Bridge opzionale a webhook ticket
            if ($model instanceof Ticket) {
                try {
                    $forward = (string)(getenv('TICKET_FORWARD_ON_CREATE') ?: '0');
                    $hook = getenv('TICKET_WEBHOOK_URL') ?: '';
                    if ($hook && ($forward === '1' || strtolower($forward) === 'true')) {
                        $dispatcher = new ServiceDispatcher();
                        $payload = [
                            'title' => $model->titolo,
                            'priority' => $model->priorita,
                            'description' => $model->descrizione,
                            'ticket_id' => (int)$model->id,
                            'created_by' => (int)$model->creato_da,
                        ];
                        $dispatcher->createTicket($payload);
                    }
                } catch (Throwable $e) { /* ignore forward errors */ }
            }
            $this->sendResponse(201, ["message" => "Record creato con successo.", "id" => $model->id]);
        } else {
            $this->sendResponse(503, ["message" => "Impossibile creare il record."]);
        }
    }

    private function handleUpdate($model, int $id) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($currentUser['ruolo'] ?? '');
        if (($model instanceof Utente || $model instanceof Gruppo) && !in_array($role, ['ADMIN','SUPERVISOR'], true)) {
            $this->sendResponse(403, ["message" => "Permesso negato."]); return;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) { $this->sendResponse(400, ["message" => "Dati JSON non validi."]); return; }
        if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }

        if ($model instanceof WorkflowStep) {
            if (isset($data['azione_id']) && !isset($data['tipo_azione_standard'])) {
                $data['tipo_azione_standard'] = $data['azione_id'];
            }
            if (isset($data['workflow_id']) && !isset($data['workflow_modello_id'])) {
                $data['workflow_modello_id'] = $data['workflow_id'];
            }
            if (isset($data['descrizione_passo']) && !isset($data['descrizione'])) {
                $data['descrizione'] = $data['descrizione_passo'];
            }
            if (array_key_exists('scadenza_standard_valore', $data) && ($data['scadenza_standard_valore'] === '' || $data['scadenza_standard_valore'] === null)) {
                $data['scadenza_standard_valore'] = null;
                $data['scadenza_standard_unita'] = null;
            }
            // Verifica responsabile solo se il payload sta modificando uno o entrambi i campi
            $hasRespUserKey = array_key_exists('responsabile_utente_id', $data);
            $hasRespGroupKey = array_key_exists('responsabile_gruppo_id', $data);
            if ($hasRespUserKey || $hasRespGroupKey) {
                // Usa il valore inviato o, se assente, quello già presente a DB
                $responsabileUtente = $data['responsabile_utente_id'] ?? $model->responsabile_utente_id ?? null;
                $responsabileGruppo = $data['responsabile_gruppo_id'] ?? $model->responsabile_gruppo_id ?? null;
                if ((empty($responsabileUtente) || $responsabileUtente === '0') && (empty($responsabileGruppo) || $responsabileGruppo === '0')) {
                    $this->sendResponse(400, ['message' => 'Specificare un responsabile utente o un gruppo per il passo.']);
                    return;
                }
            }
        }
        // Normalizzazioni specifiche per modello in update
        if ($model instanceof Gruppo) {
            if (isset($data['nome_gruppo']) && !isset($data['nome'])) {
                $data['nome'] = $data['nome_gruppo'];
            }
        }
        $oldRoleForAudit = null;
        if ($model instanceof Utente) {
            if (isset($data['password']) && $data['password'] !== '') {
                $data['password_hash'] = password_hash((string)$data['password'], PASSWORD_BCRYPT);
            }
            unset($data['password']);
            if (isset($data['ruolo'])) {
                // Carica il record per leggere il ruolo precedente
                if ($model->find($id)) {
                    $oldRoleForAudit = strtoupper($model->ruolo ?? '');
                } else {
                    $oldRoleForAudit = null;
                }
            }
        }

        // Solo ADMIN può cambiare il ruolo degli utenti
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $roleCurrent = strtoupper($currentUser['ruolo'] ?? '');
        if ($model instanceof Utente && isset($data['ruolo']) && $roleCurrent !== 'ADMIN') {
            $this->sendResponse(403, ["message" => "Solo ADMIN può cambiare il ruolo degli utenti."]); return;
        }

        // Ticket: permessi granulari in update
        if ($model instanceof Ticket) {
            $isAdmin = in_array($roleCurrent, ['ADMIN','SUPERVISOR'], true);
            if (!$isAdmin) {
                // Chi non è admin/supervisor può aggiornare solo se creatore o assegnatario
                $t = new Ticket($this->db_instance);
                if (!$t->find($id)) { $this->sendResponse(404, ["message" => "Ticket non trovato."]); return; }
                $uid = (int)($currentUser['id'] ?? 0);
                $isOwner = (int)$t->creato_da === $uid;
                $isAssignee = (int)$t->assegnato_a === $uid;
                if (!$isOwner && !$isAssignee) { $this->sendResponse(403, ["message" => "Permesso negato sul ticket."]); return; }
                // Limita i campi aggiornabili
                $allowed = ['descrizione','priorita','categoria'];
                $data = array_intersect_key($data, array_flip($allowed));
            }
        }

            if ($model->update($data)) {
                // Audit: log cambio ruolo utente
                if ($model instanceof Utente && isset($data['ruolo'])) {
                    $newRole = strtoupper($data['ruolo'] ?? '');
                    if ($oldRoleForAudit !== null && $oldRoleForAudit !== $newRole) {
                        $changerId = (int)($_SERVER['AUTH_USER']['id'] ?? 0);
                    $insSql = "INSERT INTO user_role_audit (target_user_id, old_role, new_role, changed_by_user_id) VALUES (?, ?, ?, ?)";
                    $ok = $this->db_instance->executeStatement($insSql, [$id, $oldRoleForAudit, $newRole, $changerId]);
                    if ($ok === false) {
                        // Auto-provision tabella audit e ritenta
                        $ddl = "CREATE TABLE IF NOT EXISTS user_role_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_user_id BIGINT UNSIGNED NOT NULL,
  old_role VARCHAR(64) NULL,
  new_role VARCHAR(64) NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_role_target (target_user_id),
  INDEX idx_user_role_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                        $this->db_instance->executeStatement($ddl);
                        $this->db_instance->executeStatement($insSql, [$id, $oldRoleForAudit, $newRole, $changerId]);
                    }
                    }
                }
                $this->sendResponse(200, ["message" => "Record aggiornato con successo."]);
            } else {
                $this->sendResponse(503, ["message" => "Impossibile aggiornare il record."]);
            }
    }

    private function handleDelete($model, int $id) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        $role = strtoupper($currentUser['ruolo'] ?? '');
        if (($model instanceof Utente || $model instanceof Gruppo) && !in_array($role, ['ADMIN','SUPERVISOR'], true)) {
            $this->sendResponse(403, ["message" => "Permesso negato."]); return;
        }
        // Soft delete per Utente: imposta stato = 'INATTIVO'
        if ($model instanceof Utente) {
            if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
            if ($model->update(['stato' => 'INATTIVO'])) { $this->sendResponse(200, ["message" => "Utente disattivato."]); }
            else { $this->sendResponse(503, ["message" => "Impossibile disattivare l'utente."]); }
            return;
        }

        // Soft delete per Gruppo se disponibile la colonna attivo, altrimenti fallback a delete fisico
        if ($model instanceof Gruppo) {
            if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
            $sql = "UPDATE gruppi SET attivo = 0 WHERE id = ?";
            $res = $this->db_instance->executeStatement($sql, [$id]);
            if ($res !== false && $res > 0) { $this->sendResponse(200, ["message" => "Gruppo disattivato."]); return; }
            // Se l'update fallisce (colonna assente), effettuiamo cancellazione fisica
            if ($model->delete()) { $this->sendResponse(200, ["message" => "Gruppo cancellato fisicamente (soft delete non disponibile)."]); }
            else { $this->sendResponse(503, ["message" => "Impossibile cancellare il gruppo."]); }
            return;
        }

        // Default: physical delete
        if (!$model->find($id)) { $this->sendResponse(404, ["message" => "Record non trovato."]); return; }
        if ($model->delete()) { $this->sendResponse(200, ["message" => "Record cancellato fisicamente."]); }
        else { $this->sendResponse(503, ["message" => "Impossibile cancellare il record."]); }
    }

    private function handleStartInstance(int $workflowModelId) {
        $data = json_decode(file_get_contents("php://input"));
        $utenteAvvio = isset($data->id_utente_avvio) ? (int)$data->id_utente_avvio : (int)($_SERVER['AUTH_USER']['id'] ?? 0);
        if ($utenteAvvio <= 0) { $this->sendResponse(400, ["message" => "ID utente avvio mancante."]); return; }

        try {
            $this->db_instance->conn->beginTransaction();
            $workflow_model = new Workflow($this->db_instance);
            if (!$workflow_model->find($workflowModelId)) throw new Exception("Modello workflow non trovato.", 404);

            $istanza = new WorkflowIstanza($this->db_instance);
            $istanza->workflow_modello_id = $workflowModelId;
            $istanza->entita_collegata_tipo = $data->entita_collegata_tipo ?? null;
            $istanza->entita_collegata_id = $data->entita_collegata_id ?? null;
            $istanza->stato = 'IN_CORSO';
            $istanza->avviato_da = $utenteAvvio;
            if (!$istanza->create()) throw new Exception("Impossibile creare istanza.");

            $step_model = new WorkflowStep($this->db_instance);
            $primi_passi = $step_model->findAll(['workflow_modello_id' => $workflowModelId, 'ordine' => 1]);
            if (empty($primi_passi)) throw new Exception("Nessun primo passo definito per questo workflow.");

            foreach ($primi_passi as $passo) {
                $task = new Task($this->db_instance);
                $id_utente_da_assegnare = $this->resolveAssignee($passo, $istanza->id);

                $task->nome = $passo['nome_passo'];
                $task->descrizione = $passo['descrizione'];
                $task->workflow_modello_id = $workflowModelId;
                $task->workflow_passo_id = $passo['id'];
                $task->workflow_istanza_id = $istanza->id;
                $task->assegnato_a_utente_id = $id_utente_da_assegnare;
                $task->stato = $id_utente_da_assegnare ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
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
            if ($parentTask->stato !== Task::STATO_IN_LAVORAZIONE) throw new Exception("Un sottoprocesso può essere avviato solo da un task 'In Gestione'.", 409);

            $id_istanza_padre = $parentTask->workflow_istanza_id;
            $data = json_decode(file_get_contents("php://input"));
            $utenteAvvio = isset($data->id_utente_avvio) ? (int)$data->id_utente_avvio : (int)($_SERVER['AUTH_USER']['id'] ?? 0);
            if ($utenteAvvio <= 0) { $this->sendResponse(400, ["message" => "ID utente avvio mancante."]); return; }

            $currentUser = $_SERVER['AUTH_USER'] ?? null;
            $role = strtoupper($currentUser['ruolo'] ?? '');
            $isAdmin = in_array($role, ['ADMIN', 'SUPERVISOR'], true);
            if (!$isAdmin && (int)$parentTask->assegnato_a_utente_id !== (int)$utenteAvvio) {
                throw new Exception('Solo il responsabile del task può avviare un sottoworkflow.', 403);
            }

            $this->db_instance->beginTransaction();

            $istanza = new WorkflowIstanza($this->db_instance);
            $istanza->workflow_modello_id = $subflowWorkflowId;
            $istanza->id_istanza_padre = $id_istanza_padre;
            $istanza->entita_collegata_tipo = 'SOTTOPROCESSO';
            $istanza->entita_collegata_id = (string)$parentTaskId;
            $istanza->avviato_da = $utenteAvvio;
            $istanza->stato = 'IN_CORSO';
            if (!$istanza->create()) throw new Exception("Impossibile creare l'istanza del sottoprocesso.");

            $nuova_istanza_id = $istanza->id;

            $step_model = new WorkflowStep($this->db_instance);
            $primi_passi = $step_model->findAll(['workflow_modello_id' => $subflowWorkflowId, 'ordine' => 1]);
            if (empty($primi_passi)) throw new Exception("Il workflow del sottoprocesso non ha un primo passo definito.");

            foreach ($primi_passi as $passo) {
                $task = new Task($this->db_instance);
                $id_utente_da_assegnare = $this->resolveAssignee($passo, $nuova_istanza_id);
                if (isset($data->assegna_a_utente_id) && !empty($data->assegna_a_utente_id)) {
                    $id_utente_da_assegnare = $data->assegna_a_utente_id;
                }

                $task->nome = $passo['nome_passo'];
                $task->workflow_modello_id = $subflowWorkflowId;
                $task->workflow_passo_id = $passo['id'];
                $task->workflow_istanza_id = $nuova_istanza_id;
                $task->assegnato_a_utente_id = $id_utente_da_assegnare;
                $task->stato = $id_utente_da_assegnare ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
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
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        if (!$currentUser) { $this->sendResponse(401, ["message" => "Non autenticato."]); return; }

        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN', 'SUPERVISOR'], true);

        $targetUserId = isset($data->user_id) ? (int)$data->user_id : (int)$currentUser['id'];
        if ($targetUserId <= 0) { $this->sendResponse(400, ["message" => "'user_id' mancante o non valido."]); return; }
        if (!$isAdmin && $targetUserId !== (int)$currentUser['id']) {
            $this->sendResponse(403, ["message" => "Puoi prendere in carico solo i task per te stesso."]); return;
        }

        $task = new Task($this->db_instance);
        if (!$task->find($taskId)) { $this->sendResponse(404, ["message" => "Task non trovato."]); return; }

        if (!$isAdmin && $task->assegnato_a_utente_id && (int)$task->assegnato_a_utente_id !== (int)$currentUser['id']) {
            $this->sendResponse(409, ["message" => "Task già assegnato ad un altro utente."]); return;
        }

        if (!$task->assegnaUtente($targetUserId)) {
            $this->sendResponse(409, ["message" => "Impossibile assegnare il task (probabilmente non è aperto)." ]);
            return;
        }

        $updatePayload = [
            'assegnato_a_utente_id' => $task->assegnato_a_utente_id,
            'stato' => $task->stato,
            'assegnato_il' => $task->assegnato_il,
        ];

        if ($task->update($updatePayload)) {
            $this->sendResponse(200, ["message" => "Task assegnato.", "task" => $task->toArray()]);
        } else {
            $this->sendResponse(503, ["message" => "Errore durante il salvataggio dell'assegnazione."]);
        }
    }

    private function handleCompleteTask(int $taskId) {
        try {
            $this->db_instance->conn->beginTransaction();
            $task = new Task($this->db_instance);
            if (!$task->find($taskId)) {
                throw new Exception('Task non trovato.', 404);
            }

            if (!$task->completaTask()) {
                throw new Exception("Impossibile completare. Stato non è 'In Lavorazione'.", 409);
            }

            if (!$task->update(['stato' => $task->stato, 'completato_il' => $task->completato_il])) {
                throw new Exception("Errore nel salvataggio dello stato 'Completato'.");
            }

            if (empty($task->workflow_passo_id)) {
                $this->db_instance->conn->commit();
                $this->sendResponse(200, ['message' => 'Task manuale completato.']);
                return;
            }

            $passoCorrente = new WorkflowStep($this->db_instance);
            if (!$passoCorrente->find($task->workflow_passo_id)) {
                throw new Exception('Passo del workflow non trovato (ID: ' . $task->workflow_passo_id . ').');
            }

            $sqlParallel = "SELECT COUNT(id) AS pending_tasks FROM workflow_task WHERE workflow_istanza_id = ? AND id != ? AND stato != ? AND workflow_passo_id IN (SELECT id FROM workflow_passi WHERE ordine = ? AND workflow_modello_id = ?)";
            $pending = $this->db_instance->selectOne($sqlParallel, [
                $task->workflow_istanza_id,
                $taskId,
                Task::STATO_CHIUSO,
                $passoCorrente->ordine,
                $task->workflow_modello_id
            ]);

            if ($pending && $pending['pending_tasks'] > 0) {
                $this->db_instance->conn->commit();
                $this->sendResponse(200, ['message' => 'Task completato. In attesa di altri passi paralleli.']);
                return;
            }

            $stepModel = new WorkflowStep($this->db_instance);
            $nextSteps = $stepModel->findAll(['workflow_modello_id' => $task->workflow_modello_id, 'ordine' => $passoCorrente->ordine + 1], 'sottopasso ASC');

            // Esecuzione azione automatica associata al passo (se presente)
            $actionResult = null;
            try {
                $executor = new ActionExecutor($this->db_instance, $_SERVER['AUTH_USER'] ?? null);
                $actionResult = $executor->executeForStep($passoCorrente, $task);
            } catch (Throwable $e) {
                $actionResult = ['status' => 'ERROR', 'message' => $e->getMessage()];
            }

            if (empty($nextSteps)) {
                $istanza = new WorkflowIstanza($this->db_instance);
                if ($istanza->find($task->workflow_istanza_id)) {
                    $istanza->update(['stato' => 'COMPLETATO', 'completato_il' => date('Y-m-d H:i:s')]);
                }
                $message = 'Task completato. Workflow terminato!';
            } else {
                foreach ($nextSteps as $passo) {
                    $nuovoTask = new Task($this->db_instance);
                    $idUtente = $this->resolveAssignee($passo, $task->workflow_istanza_id);
                    $nuovoTask->nome = $passo['nome_passo'];
                    $nuovoTask->descrizione = $passo['descrizione'];
                    $nuovoTask->workflow_modello_id = $task->workflow_modello_id;
                    $nuovoTask->workflow_istanza_id = $task->workflow_istanza_id;
                    $nuovoTask->workflow_passo_id = $passo['id'];
                    $nuovoTask->assegnato_a_utente_id = $idUtente;
                    $nuovoTask->stato = $idUtente ? Task::STATO_IN_LAVORAZIONE : Task::STATO_APERTO;
                    if (!$nuovoTask->create()) {
                        throw new Exception('Impossibile creare task successivo (Step ID: ' . $passo['id'] . ').');
                    }
                }
                $message = 'Task completato. Creati ' . count($nextSteps) . ' task successivi.';
            }

            $this->db_instance->conn->commit();
            $this->sendResponse(200, ['message' => $message, 'action' => $actionResult]);
        } catch (Exception $e) {
            $this->db_instance->conn->rollBack();
            $code = $e->getCode() > 0 ? $e->getCode() : 503;
            $this->sendResponse($code, ['message' => 'Errore: ' . $e->getMessage()]);
        }
    }

    private function resolveAssignee(array $passo, int $workflowIstanzaId): ?int {
        if (!empty($passo['responsabile_utente_id'])) {
            return (int)$passo['responsabile_utente_id'];
        }
        if (!empty($passo['responsabile_gruppo_id'])) {
            return $this->findUserForTask($workflowIstanzaId, (int)$passo['responsabile_gruppo_id']);
        }
        return null;
    }

    private function findUserForTask(int $workflowIstanzaId, ?int $gruppoId): ?int {
        if (is_null($gruppoId)) {
            return null;
        }

        $sqlContinuity = "SELECT t.assegnato_a_utente_id
                          FROM workflow_task t
                          JOIN utenti_gruppi ug ON t.assegnato_a_utente_id = ug.utente_id
                          WHERE t.workflow_istanza_id = ?
                            AND ug.gruppo_id = ?
                            AND t.assegnato_a_utente_id IS NOT NULL
                          ORDER BY COALESCE(t.completato_il, t.assegnato_il) DESC, t.id DESC
                          LIMIT 1";
        $result = $this->db_instance->selectOne($sqlContinuity, [$workflowIstanzaId, $gruppoId]);
        if ($result && !empty($result['assegnato_a_utente_id'])) {
            return (int) $result['assegnato_a_utente_id'];
        }

        $sqlLoadBalance = "SELECT ug.utente_id, COUNT(t.id) AS task_count
                            FROM utenti_gruppi ug
                            LEFT JOIN workflow_task t
                              ON ug.utente_id = t.assegnato_a_utente_id
                             AND t.stato != ?
                            WHERE ug.gruppo_id = ?
                            GROUP BY ug.utente_id
                            ORDER BY task_count ASC, RAND()
                            LIMIT 1";
        $result = $this->db_instance->selectOne($sqlLoadBalance, [Task::STATO_CHIUSO, $gruppoId]);
        if ($result && isset($result['utente_id'])) {
            return (int) $result['utente_id'];
        }

        return null;
    }

    private function addUserToGroup(int $groupId, int $userId) {
        $userGroup = new UtenteGruppo($this->db_instance);
        // Campi conformi allo schema: utenti_gruppi(utente_id, gruppo_id)
        $userGroup->utente_id = $userId;
        $userGroup->gruppo_id = $groupId;
        if ($userGroup->create()) $this->sendResponse(201, ["message" => "Utente aggiunto."]);
        else $this->sendResponse(409, ["message" => "Utente già presente o errore."]);
    }

    private function removeUserFromGroup(int $groupId, int $userId) {
        $sql = "DELETE FROM utenti_gruppi WHERE gruppo_id = ? AND utente_id = ?";
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

            // Aggiorna il timestamp di aggiornamento del task per riflettere la nuova nota
            try {
                $this->db_instance->executeStatement(
                    "UPDATE workflow_task SET data_aggiornamento = NOW() WHERE id = ?",
                    [ (int)$taskId ]
                );
            } catch (Throwable $e) {
                // Non bloccare il salvataggio della nota se l'update del timestamp fallisce
            }

            $this->db_instance->commit();
            $this->sendResponse(201, ["message" => "Nota aggiunta.", "id" => (int)$note->id]);
        } catch (Exception $e) {
            $this->db_instance->rollBack();
            $this->sendResponse(503, ["message" => "Errore salvataggio nota: " . $e->getMessage()]);
        }
    }

    private function handleAddTaskNoteAttachment(int $taskId) {
        // Expect multipart/form-data with fields: note_id, file
        $noteId = isset($_POST['note_id']) ? (int)$_POST['note_id'] : 0;
        if ($noteId <= 0 || !isset($_FILES['file'])) { $this->sendResponse(400, ["message" => "Parametri mancanti (note_id o file)."]); return; }

        // Verifica appartenenza nota al task
        $row = $this->db_instance->selectOne("SELECT id_task FROM task_note WHERE id = ?", [$noteId]);
        if (!$row || (int)$row['id_task'] !== (int)$taskId) { $this->sendResponse(404, ["message" => "Nota non trovata per questo task."]); return; }

        $upload = $_FILES['file'];
        $err = (int)($upload['error'] ?? UPLOAD_ERR_OK);
        if ($err !== UPLOAD_ERR_OK) {
            $map = [
                UPLOAD_ERR_INI_SIZE => 'File oltre il limite del server.',
                UPLOAD_ERR_FORM_SIZE => 'File oltre il limite consentito.',
                UPLOAD_ERR_PARTIAL => 'Upload parziale, riprova.',
                UPLOAD_ERR_NO_FILE => 'Nessun file inviato.',
                UPLOAD_ERR_NO_TMP_DIR => 'Cartella temporanea mancante.',
                UPLOAD_ERR_CANT_WRITE => 'Impossibile scrivere su disco.',
                UPLOAD_ERR_EXTENSION => 'Upload bloccato da estensione PHP.',
            ];
            $msg = $map[$err] ?? 'Errore upload.';
            $this->sendResponse(400, ["message" => $msg]);
            return;
        }
        if (!is_uploaded_file($upload['tmp_name'])) { $this->sendResponse(400, ["message" => "Upload non valido."]); return; }

        $origName = $upload['name'];
        $safeName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $origName);
        $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
        $maxMb = (int)(getenv('MAX_NOTE_ATTACHMENT_MB') ?: 10);
        $maxBytes = $maxMb > 0 ? ($maxMb * 1024 * 1024) : (10 * 1024 * 1024);
        $size = (int)($upload['size'] ?? 0);
        if ($size <= 0) { $this->sendResponse(400, ["message" => "File vuoto o non valido."]); return; }
        if ($size > $maxBytes) { $this->sendResponse(400, ["message" => "File troppo grande. Massimo {$maxMb} MB."]); return; }
        $allowedExt = ['pdf','png','jpg','jpeg','gif','doc','docx','xls','xlsx','txt','csv','zip'];
        if (!$ext || !in_array($ext, $allowedExt, true)) {
            $this->sendResponse(400, [
                'message' => 'Estensione file non consentita. Ammesse: ' . implode(', ', $allowedExt),
            ]);
            return;
        }
        $destDir = __DIR__ . '/../uploads';
        if (!is_dir($destDir)) @mkdir($destDir, 0775, true);
        // Assicura permessi di scrittura (tentativi progressivi)
        if (!is_writable($destDir)) { @chmod($destDir, 02775); }
        $destName = uniqid('note_', true) . ($ext ? ('.' . $ext) : '');
        $destPath = $destDir . '/' . $destName;
        if (!move_uploaded_file($upload['tmp_name'], $destPath)) {
            // Fallback: allarga permessi e ritenta una volta
            @chmod($destDir, 0777);
            if (!move_uploaded_file($upload['tmp_name'], $destPath)) {
                $this->sendResponse(500, ["message" => "Impossibile salvare il file."]); return;
            }
        }

        $publicPath = 'uploads/' . $destName;
        $att = new TaskNotaAllegato($this->db_instance);
        $att->id_nota = $noteId;
        $att->nome_file_originale = $origName;
        $att->percorso_file = $publicPath;
        if (!$att->create()) { $this->sendResponse(503, ["message" => "Impossibile registrare l'allegato."]); return; }

        $this->sendResponse(201, [
            'message' => 'Allegato caricato.',
            'id' => (int)$att->id,
            'nome_file' => $origName,
            'percorso' => $publicPath,
        ]);
    }

    private function handleAssignTicket(int $ticketId) {
        $data = json_decode(file_get_contents("php://input"));
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        if (!$currentUser) { $this->sendResponse(401, ["message" => "Non autenticato."]); return; }
        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN','SUPERVISOR'], true);

        $targetUserId = isset($data->user_id) ? (int)$data->user_id : (int)$currentUser['id'];
        if ($targetUserId <= 0) { $this->sendResponse(400, ["message" => "'user_id' mancante o non valido."]); return; }

        $t = new Ticket($this->db_instance);
        if (!$t->find($ticketId)) { $this->sendResponse(404, ["message" => "Ticket non trovato."]); return; }

        // Se non admin, consenti solo auto-assegnazione o ticket non assegnato
        if (!$isAdmin && !empty($t->assegnato_a) && (int)$t->assegnato_a !== (int)$currentUser['id']) {
            $this->sendResponse(403, ["message" => "Ticket già assegnato ad altro utente."]); return;
        }

        $t->assegnaUtente($targetUserId);
        $ok = $t->update(['assegnato_a' => $t->assegnato_a, 'stato' => $t->stato]);
        if ($ok) $this->sendResponse(200, ["message" => "Ticket assegnato."]);
        else $this->sendResponse(503, ["message" => "Errore durante l'assegnazione."]);
    }

    private function handleCloseTicket(int $ticketId) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        if (!$currentUser) { $this->sendResponse(401, ["message" => "Non autenticato."]); return; }

        $t = new Ticket($this->db_instance);
        if (!$t->find($ticketId)) { $this->sendResponse(404, ["message" => "Ticket non trovato."]); return; }
        // Consenti chiusura a assegnatario o admin/supervisor
        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN','SUPERVISOR'], true);
        $isAssignee = (int)$t->assegnato_a === (int)$currentUser['id'];
        if (!$isAdmin && !$isAssignee) { $this->sendResponse(403, ["message" => "Permesso negato."]); return; }
        $t->chiudi();
        $ok = $t->update(['stato' => $t->stato, 'chiuso_il' => $t->chiuso_il]);
        if ($ok) $this->sendResponse(200, ["message" => "Ticket chiuso."]);
        else $this->sendResponse(503, ["message" => "Errore durante la chiusura."]);
    }

    private function handleReopenTicket(int $ticketId) {
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        if (!$currentUser) { $this->sendResponse(401, ["message" => "Non autenticato."]); return; }
        $role = strtoupper($currentUser['ruolo'] ?? '');
        $isAdmin = in_array($role, ['ADMIN','SUPERVISOR'], true);
        if (!$isAdmin) { $this->sendResponse(403, ["message" => "Solo ADMIN/SUPERVISOR."]); return; }
        $t = new Ticket($this->db_instance);
        if (!$t->find($ticketId)) { $this->sendResponse(404, ["message" => "Ticket non trovato."]); return; }
        $t->riapri();
        $ok = $t->update(['stato' => $t->stato, 'chiuso_il' => $t->chiuso_il]);
        if ($ok) $this->sendResponse(200, ["message" => "Ticket riaperto."]);
        else $this->sendResponse(503, ["message" => "Errore durante la riapertura."]);
    }

    private function handleGetTicketComments(int $ticketId) {
        $m = new TicketComment($this->db_instance);
        $rows = $m->findAll(['ticket_id' => $ticketId]);
        $this->sendResponse(200, $rows);
    }

    private function handleAddTicketComment(int $ticketId) {
        $data = json_decode(file_get_contents("php://input"));
        $currentUser = $_SERVER['AUTH_USER'] ?? null;
        if (!$currentUser) { $this->sendResponse(401, ["message" => "Non autenticato."]); return; }
        $msg = (string)($data->messaggio ?? $data->nota ?? '');
        if (trim($msg) === '') { $this->sendResponse(400, ["message" => "Messaggio richiesto."]); return; }
        $m = new TicketComment($this->db_instance);
        $m->ticket_id = $ticketId;
        $m->utente_id = (int)$currentUser['id'];
        $m->messaggio = htmlspecialchars(strip_tags($msg));
        if ($m->create()) $this->sendResponse(201, ["message" => "Commento aggiunto.", "id" => (int)$m->id]);
        else $this->sendResponse(503, ["message" => "Errore salvataggio commento."]);
    }

    private function handleAddTicketCommentAttachment(int $ticketId) {
        $commentId = isset($_POST['comment_id']) ? (int)$_POST['comment_id'] : 0;
        if ($commentId <= 0 || !isset($_FILES['file'])) { $this->sendResponse(400, ["message" => "Parametri mancanti (comment_id o file)."]); return; }
        $row = $this->db_instance->selectOne("SELECT ticket_id FROM ticket_commenti WHERE id = ?", [$commentId]);
        if (!$row || (int)$row['ticket_id'] !== (int)$ticketId) { $this->sendResponse(404, ["message" => "Commento non trovato per questo ticket."]); return; }

        $upload = $_FILES['file'];
        $err = (int)($upload['error'] ?? UPLOAD_ERR_OK);
        if ($err !== UPLOAD_ERR_OK) {
            $map = [
                UPLOAD_ERR_INI_SIZE => 'File oltre il limite del server.',
                UPLOAD_ERR_FORM_SIZE => 'File oltre il limite consentito.',
                UPLOAD_ERR_PARTIAL => 'Upload parziale, riprova.',
                UPLOAD_ERR_NO_FILE => 'Nessun file inviato.',
                UPLOAD_ERR_NO_TMP_DIR => 'Cartella temporanea mancante.',
                UPLOAD_ERR_CANT_WRITE => 'Impossibile scrivere su disco.',
                UPLOAD_ERR_EXTENSION => 'Upload bloccato da estensione PHP.',
            ];
            $msg = $map[$err] ?? 'Errore upload.';
            $this->sendResponse(400, ["message" => $msg]);
            return;
        }
        if (!is_uploaded_file($upload['tmp_name'])) { $this->sendResponse(400, ["message" => "Upload non valido."]); return; }

        $origName = $upload['name'];
        $safeName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $origName);
        $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
        $maxMb = (int)(getenv('MAX_TICKET_ATTACHMENT_MB') ?: 10);
        $maxBytes = $maxMb > 0 ? ($maxMb * 1024 * 1024) : (10 * 1024 * 1024);
        $size = (int)($upload['size'] ?? 0);
        if ($size <= 0) { $this->sendResponse(400, ["message" => "File vuoto o non valido."]); return; }
        if ($size > $maxBytes) { $this->sendResponse(400, ["message" => "File troppo grande. Massimo {$maxMb} MB."]); return; }
        $allowedExt = ['pdf','png','jpg','jpeg','gif','doc','docx','xls','xlsx','txt','csv','zip'];
        if (!$ext || !in_array($ext, $allowedExt, true)) {
            $this->sendResponse(400, [ 'message' => 'Estensione non consentita.' ]);
            return;
        }
        $destDir = __DIR__ . '/../uploads';
        if (!is_dir($destDir)) @mkdir($destDir, 0775, true);
        if (!is_writable($destDir)) { @chmod($destDir, 02775); }
        $destName = uniqid('tka_', true) . ($ext ? ('.' . $ext) : '');
        $destPath = $destDir . '/' . $destName;
        if (!move_uploaded_file($upload['tmp_name'], $destPath)) {
            @chmod($destDir, 0777);
            if (!move_uploaded_file($upload['tmp_name'], $destPath)) {
                $this->sendResponse(500, ["message" => "Impossibile salvare il file."]); return;
            }
        }
        $publicPath = 'uploads/' . $destName;
        $sql = 'INSERT INTO ticket_allegati (commento_id, nome_file_originale, percorso_file) VALUES (?,?,?)';
        $ok = $this->db_instance->executeStatement($sql, [$commentId, $origName, $publicPath]);
        if ($ok === false) { $this->sendResponse(503, ["message" => "Impossibile registrare l\'allegato."]); return; }
        $this->sendResponse(201, [ 'message' => 'Allegato caricato.', 'percorso' => $publicPath ]);
    }

    private function handleGetTicketAttachments(int $ticketId) {
        $sql = "SELECT ta.* FROM ticket_allegati ta
                JOIN ticket_commenti tc ON tc.id = ta.commento_id
               WHERE tc.ticket_id = ?
               ORDER BY ta.id ASC";
        $rows = $this->db_instance->select($sql, [$ticketId]) ?: [];
        $this->sendResponse(200, $rows);
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
        if ($model instanceof ServiceLog) {
            $limit = isset($params['limit']) && is_numeric($params['limit']) ? (int)$params['limit'] : 50;
            if ($limit < 1) { $limit = 50; }
            if ($limit > 500) { $limit = 500; }
            $sql = "SELECT * FROM service_logs ORDER BY created_at DESC, id DESC LIMIT $limit";
            $rows = $this->db_instance->select($sql, []) ?: [];
            $this->sendResponse(200, $rows);
            return;
        }
