<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class WorkflowStep extends CrudBaseAbstract

{
    protected $table_name = 'workflow_passi';
    protected $fillable_fields = [
        'workflow_modello_id', 'nome_passo', 'descrizione', 'ordine', 'sottopasso',
        'tipo_azione_standard', 'parametri_azione',
        'scadenza_standard_valore', 'scadenza_standard_unita',
        'responsabile_utente_id', 'responsabile_gruppo_id',
        // opzionale: se la colonna esiste abilita toggle attivo/disattivo
        'attivo'
    ];

    // 3. Proprietà pubbliche aggiornate
    public $id;
    public $workflow_modello_id;
    public $nome_passo;
    public $descrizione;
    public $ordine;
    public $sottopasso;
    public $responsabile_utente_id;
    public $responsabile_gruppo_id;
    public $tipo_azione_standard;
    public $azione_id;
    public $parametri_azione;
    public $scadenza_standard_valore;
    public $scadenza_standard_unita;
    public $data_creazione;
    public $data_aggiornamento;



    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    /**
     * SOVRASCRITTO: Crea un nuovo passo con una logica di ordinamento intelligente.
     * @return bool True in caso di successo.
     */
    public function create(): bool
    {
        // 1. Prepara i dati (conversione JSON, ecc.)
        if (is_array($this->parametri_azione) || is_object($this->parametri_azione)) {
            $this->parametri_azione = json_encode($this->parametri_azione);
        }

        if (!isset($this->ordine) || !is_numeric($this->ordine)) {
            $this->ordine = $this->getNextOrderValue();
        }

        $existing_steps_at_order = $this->findAll(['workflow_modello_id' => $this->workflow_modello_id, 'ordine' => $this->ordine]);

        if (empty($existing_steps_at_order)) {
            $this->sottopasso = 1;
        } else {
            $max_sottopasso = 0;
            foreach ($existing_steps_at_order as $step) {
                if ($step['sottopasso'] > $max_sottopasso) {
                    $max_sottopasso = $step['sottopasso'];
                }
            }
            $this->sottopasso = $max_sottopasso + 1;
        }

        if (!empty($this->azione_id) && empty($this->tipo_azione_standard)) {
            $this->tipo_azione_standard = $this->azione_id;
        }

        if ($this->scadenza_standard_valore === '' || $this->scadenza_standard_valore === null) {
            $this->scadenza_standard_valore = null;
            $this->scadenza_standard_unita = null;
        }

        // 3. Esegui la creazione effettiva del record.
        // La classe base 'create' userà i valori di 'ordine' e 'sottopasso' che abbiamo appena calcolato.
        return parent::create();
    }
    
    /**
     * Calcola il prossimo valore 'ordine' disponibile per un nuovo livello sequenziale.
     * @return int Il prossimo valore di 'ordine'.
     */
    private function getNextOrderValue(): int
    {
        $sql = "SELECT MAX(ordine) as max_ordine FROM {$this->table_name} WHERE workflow_modello_id = ?";
        $result = $this->db->selectOne($sql, [$this->workflow_modello_id]);
        return ($result && isset($result['max_ordine'])) ? (int)$result['max_ordine'] + 1 : 1;
    }

    // Quando leggiamo dal DB, i parametri JSON sono una stringa.
    // Potremmo creare un metodo helper per decodificarli automaticamente in un array.
    public function getParametriAsArray(): array
    {
        if (empty($this->parametri_azione)) {
            return [];
        }
        return json_decode($this->parametri_azione, true);
    }

    // Prima di salvare, potremmo avere un metodo per codificarli.
    // L'array dei parametri deve essere in $this->parametri_azione
    // Il metodo create/update di CrudBase se lo aspetta come una stringa.
    protected function beforeSave()
    {
        // Se i parametri sono un array, li convertiamo in stringa JSON
        if (is_array($this->parametri_azione) || is_object($this->parametri_azione)) {
            $this->parametri_azione = json_encode($this->parametri_azione);
        }

        if ($this->scadenza_standard_valore === '' || $this->scadenza_standard_valore === null) {
            $this->scadenza_standard_valore = null;
            $this->scadenza_standard_unita = null;
        }

        if ($this->responsabile_gruppo_id === '' || $this->responsabile_gruppo_id === null) {
            $this->responsabile_gruppo_id = null;
        }
        if ($this->responsabile_utente_id === '' || $this->responsabile_utente_id === null) {
            $this->responsabile_utente_id = null;
        }
    }

    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $rows = parent::findAll($conditions, $orderBy);
        foreach ($rows as &$row) {
            if (!isset($row['azione_id']) && array_key_exists('tipo_azione_standard', $row)) {
                $row['azione_id'] = $row['tipo_azione_standard'];
            }
            if (!isset($row['descrizione_passo']) && array_key_exists('descrizione', $row)) {
                $row['descrizione_passo'] = $row['descrizione'];
            }
        }
        return $rows;
    }

    public function find($id): bool
    {
        $found = parent::find($id);
        if ($found) {
            $this->azione_id = $this->tipo_azione_standard;
        }
        return $found;
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        if (!isset($data['azione_id']) && isset($data['tipo_azione_standard'])) {
            $data['azione_id'] = $data['tipo_azione_standard'];
        }
        if (!isset($data['descrizione_passo']) && isset($data['descrizione'])) {
            $data['descrizione_passo'] = $data['descrizione'];
        }
        if (!isset($data['scadenza_standard_valore'])) {
            $data['scadenza_standard_valore'] = $this->scadenza_standard_valore;
        }
        if (!isset($data['scadenza_standard_unita'])) {
            $data['scadenza_standard_unita'] = $this->scadenza_standard_unita;
        }
        return $data;
    }

}
