<?php
require_once 'CrudBaseAbstract.php';
require_once 'WorkflowStep.php'; // Importante: includiamo il modello dei passi

class Workflow extends CrudBaseAbstract

{
    // Nome della tabella nel database
    protected $table_name = 'workflow_modelli';

    // Campi compilabili (usati da create e update)
    protected $fillable_fields = ['nome', 'descrizione', 'attivo', 'creato_da'];

    // Proprietà pubbliche per i dati del record
    public $id;
    public $nome;
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
        $query = "SELECT id, nome, descrizione, attivo FROM {$this->table_name}";
        $params = [];

        $where = [];
        if (!empty($conditions['search'])) {
            $where[] = 'nome LIKE ?';
            $params[] = '%' . $conditions['search'] . '%';
        }
        // include_inactive=1 per mostrare anche disattivi
        $includeInactive = !empty($conditions['include_inactive']);
        if (!$includeInactive) {
            $where[] = 'attivo = 1';
        }
        if ($where) {
            $query .= ' WHERE ' . implode(' AND ', $where);
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
        $this->nome_workflow = $this->nome;
        $step_model = new WorkflowStep($this->db);

        // Usiamo il nuovo findAll() con filtro e ordinamento
        $this->steps = $step_model->findAll(
            ['workflow_modello_id' => $this->id], // Condizione: cerca solo i passi con questo modello
            'ordine ASC, sottopasso ASC'                   // Ordinamento: per numero di passo crescente
        );

        return true;
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        if (isset($data['nome']) && !isset($data['nome_workflow'])) {
            $data['nome_workflow'] = $data['nome'];
        }
        return $data;
    }
}
