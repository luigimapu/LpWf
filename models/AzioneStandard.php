<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class AzioneStandard extends CrudBaseAbstract
{
    protected $table_name = 'azioni_standard';
    protected $fillable_fields = ['codice', 'nome', 'descrizione', 'parametri_richiesti', 'handler'];

    public $id;
    public $codice;
    public $nome;
    public $descrizione;
    public $parametri_richiesti;
    public $handler;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    // Elenco ordinato per nome per UX dei menu a tendina
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $query = "SELECT id, codice, nome, descrizione, parametri_richiesti, handler FROM {$this->table_name} ORDER BY nome ASC";
        return $this->db->select($query) ?: [];
    }
}
