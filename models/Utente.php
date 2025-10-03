<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Utente extends CrudBaseAbstract
{
    protected $table_name = 'utenti';

    protected $fillable_fields = ['nome', 'cognome', 'email', 'password_hash', 'ruolo', 'stato'];

    public $nome;
    public $cognome;
    public $email;
    public $password_hash;
    public $tenant_id;
    public $creato_il;
    public $aggiornato_il;
    public $stato;
    public $ruolo;
    
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], $orderBy = ''): array
    {
        // Base select con alias per eventuali join
        $query = "SELECT u.id, u.nome, u.cognome, u.email, CONCAT(u.nome, ' ', u.cognome) AS nome_completo, u.ruolo, u.stato, u.creato_il
                  FROM {$this->table_name} u";
        $params = [];

        $joins = [];
        $where = [];

        // Soft filter: escludi inattivi se non richiesto
        if (empty($filters['include_inactive'])) {
            $where[] = "COALESCE(u.stato, 'ATTIVO') = 'ATTIVO'";
        }

        // Ricerca full name
        if (!empty($filters['search'])) {
            $where[] = "CONCAT(u.nome, ' ', u.cognome) LIKE ?";
            $params[] = '%' . $filters['search'] . '%';
        }

        // Filtro per ruolo
        if (!empty($filters['ruolo']) && in_array(strtoupper($filters['ruolo']), ['ADMIN','SUPERVISOR','USER'], true)) {
            $where[] = "UCASE(u.ruolo) = ?";
            $params[] = strtoupper($filters['ruolo']);
        }

        // Filtro per gruppo (server-side)
        $groupId = $filters['group_id'] ?? $filters['gruppo_id'] ?? null;
        if ($groupId !== null && $groupId !== '' && $groupId !== 'all') {
            $joins[] = "JOIN utenti_gruppi ug ON ug.utente_id = u.id";
            $where[] = "ug.gruppo_id = ?";
            $params[] = (int)$groupId;
        }

        if ($joins) {
            $query .= ' ' . implode(' ', $joins);
        }
        if ($where) {
            $query .= ' WHERE ' . implode(' AND ', $where);
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
