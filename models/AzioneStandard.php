<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class AzioneStandard extends CrudBaseAbstract

{
    // 1. Definisci il nome della tabella del database
    protected $table_name = "azioni_standard";
    protected $fillable_fields = ['nome_azione', 'codice_azione', 'descrizione', 'parametri_richiesti'];


    // 2. Dichiara le proprietà pubbliche che corrispondono alle colonne della tabella
    public $id;
    public $nome_azione;
    public $codice_azione;
    public $descrizione;
    public $parametri_richiesti;

    // 3. Il costruttore chiama il genitore, passando l'oggetto Database
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    /**
     * SOVRASCRITTO: Restituisce tutte le azioni senza filtri.
     * Utile per i menu a tendina di configurazione.
     */
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $query = "SELECT * FROM {$this->table_name} ORDER BY nome_azione ASC";
        return $this->db->select($query) ?: [];
    }
}