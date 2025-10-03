<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Cliente extends CrudBaseAbstract
{
    protected $table_name = 'clienti';
    protected $fillable_fields = ['ragione_sociale','partita_iva','email','tipo_cliente'];

    public $id;
    public $ragione_sociale;
    public $partita_iva;
    public $email;
    public $tipo_cliente;

    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $sql = "SELECT id, ragione_sociale, partita_iva, email, tipo_cliente FROM {$this->table_name}";
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

