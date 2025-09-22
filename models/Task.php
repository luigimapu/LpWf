<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/CrudBaseAbstract.php';

class Task extends CrudBaseAbstract

{
    // Costanti per gli stati, per un codice più chiaro e manutenibile
    const STATO_APERTO = 1;
    const STATO_IN_LAVORAZIONE = 2;
    const STATO_CHIUSO = 3;

    // 1. Definisci il nome della tabella
    protected $table_name = "task";

    // 2. Definisci i campi "compilabili" che possono essere creati/aggiornati
    protected $fillable_fields = [
        'id_workflow',
        'id_istanza_workflow',
        'workflow_step_id', // <-- NUOVO
        'id_stato',
        'id_utente_assegnato',
        'nome',
        'descrizione','attivo'

    ];

    // Dichiariamo la nuova proprietà pubblica
    public $id;
    public $id_workflow;
    public $id_istanza_workflow;
    public $workflow_step_id; // <-- NUOVO
    public $id_stato;
    public $id_utente_assegnato;
    public $nome;
    public $descrizione;
    public $data_creazione;
    public $data_aggiornamento;
    public $attivo;


    // ... il costruttore rimane uguale ...
    public function __construct($db)
    {
        parent::__construct($db);
    }

    /**
     * SOVRASCRITTO: Metodo findAll potenziato per i Task.
     * Gestisce le JOIN per ottenere informazioni extra e filtri avanzati.
     * Supporta filtri come: ?workflow_id=1, ?id_utente_assegnato=5, ?search=testo...
     */
    public function findAll( $conditions = [], string $orderBy = ''): array
    {
        // La query ora unisce più tabelle per dati più ricchi
        // Aggiungiamo i campi ws.ordine e ws.sottopasso alla SELECT
        $query = "SELECT 
                    t.id, t.nome, t.descrizione, t.id_workflow, t.id_istanza_workflow, 
                    t.id_utente_assegnato, t.id_stato, t.workflow_step_id,
                    t.data_creazione, t.data_aggiornamento,
                    s.nome as stato_nome,
                    w.nome_workflow,
                    CONCAT(u.nome, ' ', u.cognome) as nome_utente_completo,
                    ws.ordine as step_ordine,
                    ws.sottopasso as step_sottopasso,
                    (SELECT COUNT(wi.id) FROM workflow_istanze wi WHERE wi.id_istanza_padre = t.id_istanza_workflow) as subflow_count,
                    DATEDIFF(NOW(), t.data_creazione) as giorni_trascorsi
                  FROM 
                    {$this->table_name} t
                  LEFT JOIN 
                    stati_task s ON t.id_stato = s.id
                  LEFT JOIN 
                    workflows w ON t.id_workflow = w.id
                  LEFT JOIN 
                    utenti u ON t.id_utente_assegnato = u.id
                  LEFT JOIN
                    workflow_steps ws ON t.workflow_step_id = ws.id
                  ";




        $params = [];
        $where_clauses = [];

        // Usa $conditions invece di $filters
        if (!empty($conditions['id_istanza_workflow'])) {
            $where_clauses[] = "t.id_istanza_workflow = ?";
            $params[] = $conditions['id_istanza_workflow'];
        }

        if (!empty($conditions['id_utente_assegnato'])) {
            $where_clauses[] = "t.id_utente_assegnato = ?";
            $params[] = $conditions['id_utente_assegnato'];
        }
        if (!empty($conditions['workflow_id'])) {
            $where_clauses[] = "t.id_workflow = ?";
            $params[] = $conditions['workflow_id'];
        }
        if (!empty($conditions['id_stato'])) {
            $where_clauses[] = "t.id_stato = ?";
            $params[] = $conditions['id_stato'];
        }
        // --- NUOVA LOGICA DI RICERCA GLOBALE ---
        if (!empty($conditions['search'])) {
            $searchTerm = '%' . $conditions['search'] . '%';
            $search_clauses = [
                "t.nome LIKE ?",
                "w.nome_workflow LIKE ?",
                "t.id LIKE ?",
                "t.id_istanza_workflow LIKE ?"
            ];
            // Aggiungiamo il gruppo di clausole OR alla query principale
            $where_clauses[] = "(" . implode(' OR ', $search_clauses) . ")";
            // Aggiungiamo il parametro di ricerca per ogni clausola OR
            for ($i = 0; $i < count($search_clauses); $i++) {
                $params[] = $searchTerm;
            }
        }


        if (count($where_clauses) > 0) {
            $query .= " WHERE " . implode(' AND ', $where_clauses);
        }

        $orderByClause = !empty($orderBy) ? $orderBy : 't.id DESC';
        $query .= " ORDER BY " . $orderByClause;

        return $this->db->select($query, $params) ?: [];
    }

    /**
     * NUOVO: Metodo per la presa in carico (assegnazione).
     * Contiene la logica di business per questa operazione.
     *
     * @param int $id_utente L'ID dell'utente a cui assegnare il task.
     * @return bool True se l'operazione è valida, false altrimenti.
     */
    public function assegnaUtente(int $id_utente): bool
    {
        // REGOLA DI BUSINESS: Posso assegnare un task solo se è "Aperto".
        if ($this->id_stato != self::STATO_APERTO) {
            // Non si può assegnare un task già in lavorazione o chiuso.
            return false;
        }

        $this->id_utente_assegnato = $id_utente;
        $this->id_stato = self::STATO_IN_LAVORAZIONE; // Cambia lo stato automaticamente
        return true;
    }

    /**
     * NUOVO: Metodo per il completamento (chiusura).
     * Contiene la logica di business per la chiusura.
     *
     * @return bool True se l'operazione è valida, false altrimenti.
     */
    public function completaTask(): bool
    {
        // REGOLA DI BUSINESS: Posso chiudere un task solo se è "In Lavorazione".
        if ($this->id_stato != self::STATO_IN_LAVORAZIONE) {
            // Non si può chiudere un task non ancora preso in carico o già chiuso.
            return false;
        }

        $this->id_stato = self::STATO_CHIUSO;
        // Potremmo anche voler rimuovere l'utente assegnato, ma per ora lo lasciamo
        // per mantenere lo storico di chi ha completato il lavoro.
        return true;
    }

}