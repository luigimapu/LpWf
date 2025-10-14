<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class TicketComment extends CrudBaseAbstract
{
    protected $table_name = 'ticket_commenti';

    protected $fillable_fields = [
        'ticket_id',
        'utente_id',
        'messaggio',
    ];

    public $id;
    public $ticket_id;
    public $utente_id;
    public $messaggio;
    public $creato_il;

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], string $orderBy = ''): array
    {
        $sql = "SELECT tc.*, CONCAT(u.nome, ' ', u.cognome) AS utente_nome
                  FROM {$this->table_name} tc
             LEFT JOIN utenti u ON u.id = tc.utente_id";
        $where = [];
        $params = [];
        if (!empty($filters['ticket_id'])) {
            $where[] = 'tc.ticket_id = ?';
            $params[] = (int)$filters['ticket_id'];
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $orderBy = $orderBy ?: 'tc.id ASC';
        $orderBy = preg_replace('/[^a-zA-Z0-9_,.\s]/', '', $orderBy);
        $sql .= ' ORDER BY ' . $orderBy;
        return $this->db->select($sql, $params) ?: [];
    }
}

