<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class WorkflowStep extends CrudBaseAbstract

{
    protected $table_name = "workflow_steps";
    protected $fillable_fields = [
        'workflow_id', 'nome_passo', 'descrizione_passo', 'ordine', 'sottopasso',
        'id_utente_responsabile', // Campo rinominato
        'id_gruppo_responsabile',
        'avanzamento_automatico', 'scadenza_giorni',
        'azione_id', 'parametri_azione','attivo'
    ];

    // 3. Proprietà pubbliche aggiornate
    public $id;
    public $workflow_id;
    public $nome_passo;
    public $descrizione_passo;
    public $ordine;
    public $sottopasso;
    public $id_utente_responsabile; // Campo rinominato
    public $id_gruppo_responsabile; // Nuovo campo
    public $avanzamento_automatico;
    public $attivo;

    public $scadenza_giorni;
    public $azione_id;         // <-- NUOVO
    public $parametri_azione;  // <-- NUOVO
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

        // Assicurati che l'ordine sia un numero, altrimenti calcola il prossimo disponibile.
        if (!isset($this->ordine) || !is_numeric($this->ordine)) {
            $this->ordine = $this->getNextOrderValue();
        }

        // 2. Controlla se esistono già passi a questo livello di 'ordine'.
        $existing_steps_at_order = $this->findAll(['workflow_id' => $this->workflow_id, 'ordine' => $this->ordine]);

        if (empty($existing_steps_at_order)) {
            // --- Caso A: Inserimento in un nuovo livello (sequenziale) ---
            // Non c'è nulla a questo livello, quindi questo è il primo passo (sottopasso 1).
            $this->sottopasso = 1;
        } else {
            // --- Caso B: Inserimento in un livello esistente (parallelo) ---
            // Esistono già uno o più passi. Troviamo il massimo 'sottopasso' e aggiungiamo 1.
            $max_sottopasso = 0;
            foreach ($existing_steps_at_order as $step) {
                if ($step['sottopasso'] > $max_sottopasso) {
                    $max_sottopasso = $step['sottopasso'];
                }
            }
            $this->sottopasso = $max_sottopasso + 1;
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
        $sql = "SELECT MAX(ordine) as max_ordine FROM {$this->table_name} WHERE workflow_id = ?";
        $result = $this->db->selectOne($sql, [$this->workflow_id]); // Usa selectOne per un solo risultato
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
        if (is_array($this->parametri_azione)|| is_object($this->parametri_azione)
        ) {
            $this->parametri_azione = json_encode($this->parametri_azione);
        }
    }

}