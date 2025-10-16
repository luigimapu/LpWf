<?php
require_once 'CrudBaseAbstract.php';

class Gruppo extends CrudBaseAbstract
{
    protected $table_name = "gruppi";
    // Allineato allo schema: colonna "nome". Manteniamo compat nomi storici via mapping in API.
    protected $fillable_fields = ['nome', 'descrizione', 'attivo'];

    public $id;
    public $nome;         // colonna reale in DB
    public $nome_gruppo;  // alias legacy per compatibilità UI
    public $descrizione;
    public $attivo;       // se presente nel DB, usato per soft delete/filtri

    // Aggiungiamo una proprietà pubblica per contenere gli utenti del gruppo
    public $users = [];

    public function __construct(Database $db)
    {
        parent::__construct($db);
    }

    public function findAll($filters = [], string $orderBy = ''): array
    {
        $sql = 'SELECT id, nome, descrizione' . (isset($this->attivo) ? ', attivo' : '') . ' FROM ' . $this->table_name;
        $where = [];
        $params = [];
        // Ricerca per nome/descrizione
        if (!empty($filters['search'])) {
            $where[] = '(nome LIKE ? OR descrizione LIKE ?)';
            $term = '%' . $filters['search'] . '%';
            $params[] = $term; $params[] = $term;
        }
        // Facoltativo: includi inattivi, se esiste la colonna attivo
        if (array_key_exists('include_inactive', $filters)) {
            // no-op: mostra tutto
        } else {
            // Se la colonna esiste e non è stato richiesto include_inactive, filtra attivi
            try {
                $cols = $this->db->select('SHOW COLUMNS FROM `' . $this->table_name . '` LIKE "attivo"') ?: [];
                if (!empty($cols)) { $where[] = '(attivo IS NULL OR attivo = 1)'; }
            } catch (Throwable $e) { /* ignore */ }
        }
        if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
        $orderBy = $orderBy ?: 'nome ASC';
        $sql .= ' ORDER BY ' . preg_replace('/[^a-zA-Z0-9_, .]/', '', $orderBy);
        $limit = isset($filters['limit']) ? (int)$filters['limit'] : 0;
        if ($limit > 0) { $sql .= ' LIMIT ' . (int)min(200, max(1, $limit)); }
        return $this->db->select($sql, $params) ?: [];
    }

    /**
     * Trova un gruppo tramite ID e carica anche tutti i suoi utenti associati.
     * @param int $group_id L'ID del gruppo da trovare.
     * @return bool True se il gruppo viene trovato, false altrimenti.
     */
    public function findWithUsers(int $group_id): bool
    {
        // 1. Trova i dati principali del gruppo usando il metodo find() della classe base
        if (!$this->find($group_id)) {
            return false; // Se il gruppo non esiste, ci fermiamo
        }

        // 2. Se il gruppo è stato trovato, carica i suoi utenti
        $query = "SELECT u.id, u.nome, u.cognome, u.email 
                  FROM utenti u
                  JOIN utenti_gruppi ug ON u.id = ug.utente_id
                  WHERE ug.gruppo_id = ?";

        $this->users = $this->db->select($query, [$this->id]) ?: [];

        // Propaga alias legacy per facilitare i client che si aspettano nome_gruppo
        if (empty($this->nome_gruppo) && !empty($this->nome)) {
            $this->nome_gruppo = $this->nome;
        }

        return true;
    }
}
