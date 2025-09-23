<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Utente extends CrudBaseAbstract
{
    protected $table_name = 'utenti';

    protected $fillable_fields = ['nome', 'cognome', 'email', 'password_hash', 'tenant_id', 'attivo'];

    public $nome;
    public $cognome;
    public $email;
    public $password_hash;
    public $tenant_id;
    public $data_creazione;
    public $attivo;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], $orderBy = ''): array
    {
        $query = "SELECT id, nome, cognome, email, CONCAT(nome, ' ', cognome) as nome_completo, tenant_id, attivo
                  FROM {$this->table_name}";
        $params = [];

        $where_clauses = [];
        if (!empty($filters['include_inactive'])) {
            // nessun filtro
        } else {
            $where_clauses[] = 'attivo = 1';
        }

        if (!empty($filters['search'])) {
            $where_clauses[] = "CONCAT(nome, ' ', cognome) LIKE ?";
            $params[] = '%' . $filters['search'] . '%';
        }

        if ($where_clauses) {
            $query .= ' WHERE ' . implode(' AND ', $where_clauses);
        }

        $orderBy = $orderBy ?: 'nome_completo ASC';
        $query .= ' ORDER BY ' . preg_replace('/[^a-zA-Z0-9_, ASCascDESCdesc ]/', '', $orderBy);

        return $this->db->select($query, $params) ?: [];
    }

    public function findByEmail(string $email): ?array
    {
        $sql = "SELECT * FROM {$this->table_name} WHERE email = ? LIMIT 1";
        $result = $this->db->selectOne($sql, [$email]);
        return $result ?: null;
    }

    public function toPublicArray(): array
    {
        $data = $this->toArray();
        unset($data['password_hash']);
        return $data;
    }
}
