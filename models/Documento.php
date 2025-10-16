<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Documento extends CrudBaseAbstract
{
    protected $table_name = 'documenti';
    protected $fillable_fields = [
        'tipo_documento','numero','serie','data_emissione','cliente_id','stato',
        'totale_imponibile','totale_imposta','totale_documento','creato_il','aggiornato_il'
    ];

    public $id;
    public $tipo_documento;
    public $numero;
    public $serie;
    public $data_emissione;
    public $cliente_id;
    public $stato;
    public $totale_imponibile;
    public $totale_imposta;
    public $totale_documento;
    public $creato_il;
    public $aggiornato_il;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], string $orderBy = ''): array
    {
        $sql = 'SELECT * FROM ' . $this->table_name;
        $where = [];
        $params = [];
        if (!empty($filters['tipo']) || !empty($filters['tipo_documento'])) {
            $where[] = 'tipo_documento = ?';
            $params[] = $filters['tipo'] ?? $filters['tipo_documento'];
        }
        if (!empty($filters['stato'])) {
            $where[] = 'stato = ?';
            $params[] = $filters['stato'];
        }
        if (!empty($filters['cliente_id'])) {
            $where[] = 'cliente_id = ?';
            $params[] = (int)$filters['cliente_id'];
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $orderBy = $orderBy ?: 'id DESC';
        $sql .= ' ORDER BY ' . preg_replace('/[^a-zA-Z0-9_, .]/', '', $orderBy);
        $limit = isset($filters['limit']) ? (int)$filters['limit'] : 50;
        if ($limit > 0) {
            $sql .= ' LIMIT ' . (int)min(200, max(1, $limit));
        }
        return $this->db->select($sql, $params) ?: [];
    }
}

