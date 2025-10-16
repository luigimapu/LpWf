<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class Ticket extends CrudBaseAbstract
{
    protected $table_name = 'tickets';

    protected $fillable_fields = [
        'titolo',
        'descrizione',
        'priorita',
        'stato',
        'creato_da',
        'assegnato_a',
        'cliente_id',
        'categoria',
        'chiuso_il',
    ];

    public $id;
    public $titolo;
    public $descrizione;
    public $priorita;
    public $stato;
    public $creato_da;
    public $assegnato_a;
    public $cliente_id;
    public $categoria;
    public $creato_il;
    public $aggiornato_il;
    public $chiuso_il;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], string $orderBy = ''): array
    {
        $sql = "SELECT t.*, 
                       CONCAT(u1.nome, ' ', u1.cognome) AS creato_da_nome,
                       CONCAT(u2.nome, ' ', u2.cognome) AS assegnato_a_nome,
                       c.ragione_sociale AS cliente_nome
                  FROM {$this->table_name} t
             LEFT JOIN utenti u1 ON u1.id = t.creato_da
             LEFT JOIN utenti u2 ON u2.id = t.assegnato_a
             LEFT JOIN clienti c ON c.id = t.cliente_id";

        $where = [];
        $params = [];

        if (!empty($filters['stato'])) {
            $where[] = 't.stato = ?';
            $params[] = $filters['stato'];
        }
        if (!empty($filters['priorita'])) {
            $where[] = 't.priorita = ?';
            $params[] = $filters['priorita'];
        }
        if (!empty($filters['assegnato_a'])) {
            $where[] = 't.assegnato_a = ?';
            $params[] = (int)$filters['assegnato_a'];
        } elseif (!empty($filters['id_utente_assegnato'])) {
            $where[] = 't.assegnato_a = ?';
            $params[] = (int)$filters['id_utente_assegnato'];
        }
        if (!empty($filters['creato_da'])) {
            $where[] = 't.creato_da = ?';
            $params[] = (int)$filters['creato_da'];
        }
        if (!empty($filters['cliente_id'])) {
            $where[] = 't.cliente_id = ?';
            $params[] = (int)$filters['cliente_id'];
        }
        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $where[] = '(t.titolo LIKE ? OR t.descrizione LIKE ? OR c.ragione_sociale LIKE ?)';
            $params[] = $term; $params[] = $term; $params[] = $term;
        }
        if (!empty($filters['visible_for_user_id'])) {
            $uid = (int)$filters['visible_for_user_id'];
            $where[] = '(t.creato_da = ? OR t.assegnato_a = ?)';
            $params[] = $uid; $params[] = $uid;
        }
        if (!empty($filters['team_of_supervisor_id'])) {
            $supId = (int)$filters['team_of_supervisor_id'];
            // Recupera utenti del team del supervisor
            $rows = $this->db->select('SELECT user_id FROM supervisori_utenti WHERE supervisor_id = ?', [$supId]) ?: [];
            $ids = array_map(fn($r) => (int)($r['user_id'] ?? 0), $rows);
            $ids = array_values(array_filter($ids, fn($v) => $v > 0));
            if (count($ids) > 0) {
                $ph = implode(',', array_fill(0, count($ids), '?'));
                $where[] = "(t.creato_da IN ($ph) OR t.assegnato_a IN ($ph))";
                $params = array_merge($params, $ids, $ids);
            } else {
                // Nessun utente associato → nessun risultato
                $where[] = '1=0';
            }
        }

        // Filtra per data chiusura (da) se specificata
        if (!empty($filters['chiuso_dal'])) {
            $where[] = 't.chiuso_il IS NOT NULL AND t.chiuso_il >= ?';
            $params[] = $filters['chiuso_dal'];
        }

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $orderBy = $orderBy ?: 't.id DESC';
        $orderBy = preg_replace('/[^a-zA-Z0-9_,.\s]/', '', $orderBy);
        $sql .= ' ORDER BY ' . $orderBy;

        $rows = $this->db->select($sql, $params) ?: [];
        return $rows;
    }

    public function assegnaUtente(int $userId): void
    {
        $this->assegnato_a = $userId;
        if ($this->stato === null || $this->stato === '' || strtoupper($this->stato) === 'APERTO') {
            $this->stato = 'IN_LAVORAZIONE';
        }
    }

    public function chiudi(): void
    {
        $this->stato = 'CHIUSO';
        $this->chiuso_il = date('Y-m-d H:i:s');
    }

    public function riapri(): void
    {
        $this->stato = 'APERTO';
        $this->chiuso_il = null;
    }

    public function find($id): bool
    {
        $sql = "SELECT t.*, 
                       CONCAT(u1.nome, ' ', u1.cognome) AS creato_da_nome,
                       CONCAT(u2.nome, ' ', u2.cognome) AS assegnato_a_nome,
                       c.ragione_sociale AS cliente_nome
                  FROM {$this->table_name} t
             LEFT JOIN utenti u1 ON u1.id = t.creato_da
             LEFT JOIN utenti u2 ON u2.id = t.assegnato_a
             LEFT JOIN clienti c ON c.id = t.cliente_id
                 WHERE t.id = ?";
        $row = $this->db->selectOne($sql, [$id]);
        if (!$row) return false;
        foreach ($row as $k => $v) {
            if (property_exists($this, $k)) { $this->{$k} = $v; }
        }
        // also expose joined fields as dynamic properties
        $this->creato_da_nome = $row['creato_da_nome'] ?? null;
        $this->assegnato_a_nome = $row['assegnato_a_nome'] ?? null;
        $this->cliente_nome = $row['cliente_nome'] ?? null;
        return true;
    }
}
