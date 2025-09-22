<?php
require_once 'CrudBaseAbstract.php';

class Gruppo extends CrudBaseAbstract
{
    protected $table_name = "gruppi";
    protected $fillable_fields = ['nome_gruppo', 'descrizione', 'attivo'];

    public $id;
    public $nome_gruppo;
    public $descrizione;
    public $attivo;

    // Aggiungiamo una proprietà pubblica per contenere gli utenti del gruppo
    public $users = [];

    public function __construct(Database $db)
    {
        parent::__construct($db);
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
                  JOIN utenti_gruppi ug ON u.id = ug.id_utente
                  WHERE ug.id_gruppo = ?";

        $this->users = $this->db->select($query, [$this->id]) ?: [];

        return true;
    }
}