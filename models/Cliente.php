<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Cliente extends CrudBaseAbstract
{
    protected $table_name = 'clienti';
    protected $fillable_fields = [
        'ragione_sociale','partita_iva','codice_fiscale','email','telefono',
        'indirizzo','cap','citta','provincia','nazione','latitudine','longitudine',
        'tipo_cliente','note','creato_il','aggiornato_il','deleted_il'
    ];

    public $id;
    public $ragione_sociale;
    public $partita_iva;
    public $codice_fiscale;
    public $email;
    public $telefono;
    public $indirizzo;
    public $cap;
    public $citta;
    public $provincia;
    public $nazione;
    public $latitudine;
    public $longitudine;
    public $tipo_cliente;
    public $note;
    public $creato_il;
    public $aggiornato_il;
    public $deleted_il;

    private static $columnsCache = null;

    private function columnExists(string $name): bool
    {
        if (self::$columnsCache === null) {
            $rows = $this->db->select("SHOW COLUMNS FROM `{$this->table_name}`") ?: [];
            $names = [];
            foreach ($rows as $r) { if (!empty($r['Field'])) { $names[strtolower($r['Field'])] = true; } }
            self::$columnsCache = $names;
        }
        return isset(self::$columnsCache[strtolower($name)]);
    }

    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $selectCols = [
            'id', 'ragione_sociale', 'partita_iva', 'codice_fiscale', 'email', 'telefono',
            'indirizzo', 'cap', 'citta', 'provincia', 'nazione',
        ];
        // Aggiungi lat/long solo se esistono nel DB
        if ($this->columnExists('latitudine')) { $selectCols[] = 'latitudine'; }
        if ($this->columnExists('longitudine')) { $selectCols[] = 'longitudine'; }
        $selectCols = array_merge($selectCols, ['tipo_cliente', 'note', 'creato_il', 'aggiornato_il']);

        $sql = 'SELECT ' . implode(', ', $selectCols) . " FROM {$this->table_name}";
        $params = [];
        $where = [];
        if (!empty($conditions['search'])) {
            $where[] = '(ragione_sociale LIKE ? OR partita_iva LIKE ? OR email LIKE ?)';
            $term = '%' . $conditions['search'] . '%';
            $params[] = $term; $params[] = $term; $params[] = $term;
        }
        if (!empty($conditions['tipo_cliente'])) {
            $where[] = 'tipo_cliente = ?';
            $params[] = $conditions['tipo_cliente'];
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY ragione_sociale ASC';
        $limit = isset($conditions['limit']) ? (int)$conditions['limit'] : 50;
        if ($limit > 0) { $sql .= ' LIMIT ' . (int)min(200, max(1, $limit)); }
        return $this->db->select($sql, $params) ?: [];
    }
}
