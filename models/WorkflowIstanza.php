<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class WorkflowIstanza extends CrudBaseAbstract

{
    // 1. Definisci il nome della tabella
    protected $table_name = "workflow_istanze";

    // 2. Definisci i campi che possono essere creati/aggiornati
    protected $fillable_fields = [
        'workflow_modello_id',
        'entita_collegata_tipo',
        'entita_collegata_id',
        'stato',
        'avviato_da',
        'id_istanza_padre',
        'completato_il'
    ];

    // 3. Dichiara le proprietà pubbliche per l'accesso ai dati
    public $id;
    public $workflow_modello_id;
    public $entita_collegata_tipo;
    public $entita_collegata_id;
    public $stato;
    public $avviato_da;
    public $avviato_il;
    public $completato_il;
    public $tasks = [];
    public $id_istanza_padre;



    /**
     * Costruttore.
     * @param PDO $db_connection La connessione al database.
     */
    public function __construct($db_connection)
    {
        parent::__construct($db_connection);
    }
    /**
     * NUOVO: Trova un'istanza tramite ID e carica anche tutti i suoi task associati.
     * Questo metodo arricchisce l'oggetto con un array di task.
     * @param int $instance_id L'ID dell'istanza di workflow da trovare.
     * @return bool True se l'istanza viene trovata, false altrimenti.
     */
    public function findWithDetails(int $instance_id): bool
    {
        // 1. Trova i dati principali dell'istanza usando il metodo find() della classe base
        if (!$this->find($instance_id)) {
            return false; // Se l'istanza non esiste, ci fermiamo
        }

        // 2. Se l'istanza è stata trovata, carica tutti i suoi task associati
        $task_model = new Task($this->db);

        // Usiamo il metodo findAll del modello Task, passandogli un filtro
        $this->tasks = $task_model->findAll(
            ['id_istanza_workflow' => $this->id], // Condizione: solo i task di questa istanza
            'id ASC'                              // Ordinamento: per ID crescente (ordine cronologico)
        );

        return true;
    }
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        // Aggiungiamo la subquery per contare le istanze figlie
        $query = "SELECT 
                    wi.*, 
                    CONCAT(u.nome, ' ', u.cognome) as nome_utente_avvio,
                    wm.nome as nome_workflow,
                    (SELECT COUNT(sub.id) FROM workflow_istanze sub WHERE sub.id_istanza_padre = wi.id) as subflow_count
                  FROM 
                    {$this->table_name} wi
                  LEFT JOIN 
                    utenti u ON wi.avviato_da = u.id
                  LEFT JOIN
                    workflow_modelli wm ON wi.workflow_modello_id = wm.id";


        $params = [];
        $where_clauses = [];

        // Filtro per istanza padre (usato per trovare i figli di un genitore)
        if (!empty($conditions['visible_for_user_id'])) {
            $userId = (int)$conditions['visible_for_user_id'];
            $where_clauses[] = '(wi.avviato_da = ? OR EXISTS (
                SELECT 1 FROM workflow_task t
                WHERE t.workflow_istanza_id = wi.id
                  AND t.assegnato_a_utente_id = ?
            ))';
            $params[] = $userId;
            $params[] = $userId;
            unset($conditions['visible_for_user_id']);
        }

        if (!empty($conditions['id_istanza_padre'])) {
            $where_clauses[] = "wi.id_istanza_padre = ?";
            $params[] = $conditions['id_istanza_padre'];
        } else {
            $where_clauses[] = "wi.id_istanza_padre IS NULL";
        }

        if (count($where_clauses) > 0) {
            $query .= " WHERE " . implode(' AND ', $where_clauses);
        }

        $query .= " ORDER BY wi.id DESC";

        $rows = $this->db->select($query, $params) ?: [];
        foreach ($rows as &$row) {
            if (!isset($row['workflow_id']) && isset($row['workflow_modello_id'])) {
                $row['workflow_id'] = $row['workflow_modello_id'];
            }
            if (!isset($row['stato_istanza']) && isset($row['stato'])) {
                $row['stato_istanza'] = $row['stato'];
            }
        }

        return $rows;
    }

    public function utenteCoinvolto(int $userId): bool
    {
        $sql = "SELECT 1 FROM workflow_task WHERE workflow_istanza_id = ? AND assegnato_a_utente_id = ? LIMIT 1";
        $result = $this->db->selectOne($sql, [$this->id, $userId]);
        return $result !== false && !empty($result);
    }
}
