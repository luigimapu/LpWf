<?php
require_once 'CrudBaseAbstract.php';
require_once 'WorkflowStep.php'; // Importante: includiamo il modello dei passi

class Workflow extends CrudBaseAbstract

{
    // Nome della tabella nel database
    protected $table_name = "workflows";

    // Campi compilabili (usati da create e update)
    protected $fillable_fields = ['nome_workflow', 'descrizione', 'attivo'];

    // Proprietà pubbliche per i dati del record
    public $id;
    public $nome_workflow;
    public $descrizione;
    public $attivo;
    public $data_creazione;

    // Aggiungiamo una proprietà per contenere i passi
    public $steps = [];
    /**
     * SOVRASCRITTO: Gestisce la ricerca per nome_workflow.
     */
    public function findAll( $conditions = [], string $orderBy = ''): array
    {
        $query = "SELECT * FROM {$this->table_name}";
        $params = [];

        if (!empty($conditions['search'])) {
            $query .= " WHERE nome_workflow LIKE ?";
            $params[] = '%' . $conditions['search'] . '%';
        } else {
            // Aggiungo un filtro per attivo se non c'è una ricerca
            $query .= " WHERE attivo = 1";
        }

        return $this->db->select($query, $params) ?: [];
    }

    /**
     * Trova un workflow tramite ID e carica anche tutti i suoi passi associati.
     * @param int $workflow_id L'ID del workflow da trovare.
     * @return bool True se il workflow viene trovato, false altrimenti.
     */
    public function findWithSteps($workflow_id): bool
    {
        // 1. Trova i dati principali del workflow usando il metodo find() della classe padre
        if (!$this->find($workflow_id)) {
            return false; // Se il workflow non esiste, interrompiamo subito
        }

        // 2. Se il workflow è stato trovato, carica i suoi passi
        $step_model = new WorkflowStep($this->db);

        // Usiamo il nuovo findAll() con filtro e ordinamento
        $this->steps = $step_model->findAll(
            ['workflow_id' => $this->id], // Condizione: cerca solo i passi con questo ID workflow
            'ordine ASC, sottopasso ASC'                   // Ordinamento: per numero di passo crescente
        );

        return true;
    }
}