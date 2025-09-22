<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class WorkflowIstanza extends CrudBaseAbstract

{
    // 1. Definisci il nome della tabella
    protected $table_name = "workflow_istanze";

    // 2. Definisci i campi che possono essere creati/aggiornati
    protected $fillable_fields = [
        'workflow_id',
        'id_entita_associata',
        'nome_entita_associata',
        'stato_istanza','attivo', 'id_istanza_padre','id_utente_avvio'

        // Le date sono gestite automaticamente dal database
    ];

    // 3. Dichiara le proprietà pubbliche per l'accesso ai dati
    public $id;
    public $workflow_id;
    public $id_entita_associata;
    public $nome_entita_associata;
    public $stato_istanza;
    public $data_avvio;
    public $data_completamento;
    // Aggiungiamo una proprietà per contenere i task
    public $tasks = [];
    public $attivo;
    public $id_istanza_padre;
    public $id_utente_avvio;



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
                    (SELECT COUNT(sub.id) FROM workflow_istanze sub WHERE sub.id_istanza_padre = wi.id) as subflow_count
                  FROM 
                    {$this->table_name} wi
                  LEFT JOIN 
                    utenti u ON wi.id_utente_avvio = u.id";


        $params = [];
        $where_clauses = [];

        // Filtro per istanza padre (usato per trovare i figli di un genitore)
        if (!empty($conditions['id_istanza_padre'])) {
            $where_clauses[] = "wi.id_istanza_padre = ?";
            $params[] = $conditions['id_istanza_padre'];
        }

        // Aggiungiamo un filtro per mostrare solo le istanze principali
        // (quelle che non sono sottoprocessi) nella vista di default.
        if (empty($conditions)) {
            $where_clauses[] = "wi.id_istanza_padre IS NULL";
        }

        if (count($where_clauses) > 0) {
            $query .= " WHERE " . implode(' AND ', $where_clauses);
        }

        $query .= " ORDER BY wi.id DESC";

        return $this->db->select($query, $params) ?: [];
    }


}
