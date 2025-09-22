<?php
/*CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);*/
require_once __DIR__ . '/CrudBaseAbstract.php';


class Utente extends CrudBaseAbstract

{
    // 1. Definisci il nome della tabella
    protected $table_name = "utenti";

    // 2. Definisci i campi che possono essere creati/aggiornati
    protected $fillable_fields = ['nome', 'cognome', 'email','attivo'];

    // 3. Dichiara le proprietà pubbliche per l'accesso e l'autocompletamento dell'IDE
    public $nome;
    public $cognome; 
    public $email;
    public $data_creazione;
    public $attivo;

    // Il costruttore ora deve solo chiamare il costruttore padre
    public function __construct(Database $db)
    {
        parent::__construct($db);
    }
    /**
     * SOVRASCRITTO: Gestisce la ricerca per nome e cognome.
     */
    public function findAll( $filters = [],$orderBy=''): array
    {
        $query = "SELECT id, nome, cognome, email, CONCAT(nome, ' ', cognome) as nome_completo 
                  FROM {$this->table_name}";
        $params = [];

        // Filtra per utenti attivi, a meno che non sia specificato diversamente
        $where_clauses = ['attivo = 1'];

        if (!empty($conditions['search'])) {
            $where_clauses[] = "CONCAT(nome, ' ', cognome) LIKE ?";
            $params[] = '%' . $conditions['search'] . '%';
        }

        if (count($where_clauses) > 0) {
            $query .= " WHERE " . implode(' AND ', $where_clauses);
        }

        if (empty($orderBy)) {
            $orderBy = 'nome_completo ASC';
        }
        $query .= " ORDER BY " . preg_replace('/[^a-zA-Z0-9_, ASCascDESCdesc ]/', '', $orderBy);

        return $this->db->select($query, $params) ?: [];

    }

    /**
     * Cerca gli utenti nel database.
     * Se viene fornito un termine di ricerca, filtra i risultati.
     * @param string|null $searchTerm Il testo da cercare (opzionale).
     * @return array La lista degli utenti trovati.
     */
    /*public function search($searchTerm = null)
    {
        // Selezioniamo l'ID e concateniamo nome e cognome in un unico campo "nome_completo"
        // che useremo per la visualizzazione nella combobox.
        $sql = "SELECT id, CONCAT(nome, ' ', cognome) as nome_completo FROM {$this->table_name}";
        $params = [];

        // Se l'utente sta cercando qualcosa, aggiungiamo una clausola WHERE
        if ($searchTerm) {
            $sql .= " WHERE CONCAT(nome, ' ', cognome) LIKE ?";
            $params[] = '%' . $searchTerm . '%';
        }

        $sql .= " ORDER BY nome_completo ASC";

        $result = $this->db->select($sql, $params);

        // Restituiamo il risultato o un array vuoto in caso di fallimento
        return $result ? $result : [];
    }*/


    // NOTA: Tutti i metodi CRUD (leggiUno, leggiTutti, crea, aggiorna, elimina)
    // sono ora ereditati da CrudBase e non devono essere riscritti!
    // Abbiamo rinominato 'leggiTutti' in 'findAll' e 'leggiUno' in 'find'
    // per coerenza.
}