<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/CrudBaseAbstract.php';

class Task extends CrudBaseAbstract

{
    // Costanti per gli stati, per un codice più chiaro e manutenibile
    const STATO_APERTO = 'APERTO';
    const STATO_IN_LAVORAZIONE = 'IN_LAVORAZIONE';
    const STATO_CHIUSO = 'COMPLETATO';

    // 1. Definisci il nome della tabella
    protected $table_name = 'workflow_task';

    // 2. Definisci i campi "compilabili" che possono essere creati/aggiornati
    protected $fillable_fields = [
        'workflow_istanza_id',
        'workflow_passo_id',
        'nome',
        'descrizione',
        'stato',
        'assegnato_a_utente_id',
        'assegnato_il',
        'completato_il',
        'note'
    ];

    // Dichiariamo la nuova proprietà pubblica
    public $id;
    public $workflow_modello_id;
    public $workflow_istanza_id;
    public $workflow_passo_id;
    public $stato;
    public $assegnato_a_utente_id;
    public $nome;
    public $descrizione;
    public $data_creazione;
    public $data_aggiornamento;
    public $assegnato_il;
    public $completato_il;
    public $note;
    public $step_ordine;
    public $step_sottopasso;


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
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        $query = "SELECT
                    t.id,
                    t.nome,
                    t.descrizione,
                    t.workflow_istanza_id,
                    t.workflow_passo_id,
                    t.stato,
                    t.assegnato_a_utente_id,
                    t.assegnato_il,
                    t.completato_il,
                    t.note,
                    wi.workflow_modello_id,
                    wi.id AS id_istanza_workflow,
                    wi.entita_collegata_tipo,
                    wi.entita_collegata_id,
                    wm.nome AS nome_workflow,
                    wp.nome_passo,
                    wp.ordine AS step_ordine,
                    wp.sottopasso AS step_sottopasso,
                    CONCAT(u.nome, ' ', u.cognome) AS nome_utente_completo,
                    (SELECT COUNT(*) FROM workflow_istanze sub WHERE sub.id_istanza_padre = wi.id) AS subflow_count,
                    DATEDIFF(NOW(), t.assegnato_il) AS giorni_trascorsi,
                    CASE t.stato
                        WHEN 'APERTO' THEN 1
                        WHEN 'IN_LAVORAZIONE' THEN 2
                        WHEN 'COMPLETATO' THEN 3
                        WHEN 'ANNULLATO' THEN 4
                        ELSE 0
                    END AS id_stato
                  FROM {$this->table_name} t
                  INNER JOIN workflow_istanze wi ON wi.id = t.workflow_istanza_id
                  LEFT JOIN workflow_passi wp ON wp.id = t.workflow_passo_id
                  INNER JOIN workflow_modelli wm ON wm.id = wi.workflow_modello_id
                  LEFT JOIN utenti u ON u.id = t.assegnato_a_utente_id";

        $params = [];
        $where = [];

        if (!empty($conditions['workflow_istanza_id'])) {
            $where[] = 't.workflow_istanza_id = ?';
            $params[] = (int) $conditions['workflow_istanza_id'];
        } elseif (!empty($conditions['id_istanza_workflow'])) {
            $where[] = 't.workflow_istanza_id = ?';
            $params[] = (int) $conditions['id_istanza_workflow'];
        }

        if (!empty($conditions['workflow_modello_id'])) {
            $where[] = 'wi.workflow_modello_id = ?';
            $params[] = (int) $conditions['workflow_modello_id'];
        } elseif (!empty($conditions['workflow_id'])) {
            $where[] = 'wi.workflow_modello_id = ?';
            $params[] = (int) $conditions['workflow_id'];
        } elseif (!empty($conditions['id_workflow'])) {
            $where[] = 'wi.workflow_modello_id = ?';
            $params[] = (int) $conditions['id_workflow'];
        }

        if (!empty($conditions['id_utente_assegnato'])) {
            $where[] = 't.assegnato_a_utente_id = ?';
            $params[] = (int) $conditions['id_utente_assegnato'];
        } elseif (!empty($conditions['assegnato_a_utente_id'])) {
            $where[] = 't.assegnato_a_utente_id = ?';
            $params[] = (int) $conditions['assegnato_a_utente_id'];
        }

        if (!empty($conditions['unassigned']) && filter_var($conditions['unassigned'], FILTER_VALIDATE_BOOLEAN)) {
            $where[] = 't.assegnato_a_utente_id IS NULL';
        }

        if (!empty($conditions['id_stato'])) {
            $mappedState = $this->mapLegacyStateId((int) $conditions['id_stato']);
            if ($mappedState !== null) {
                $where[] = 't.stato = ?';
                $params[] = $mappedState;
            }
        } elseif (!empty($conditions['stato'])) {
            $where[] = 't.stato = ?';
            $params[] = $conditions['stato'];
        }

        if (!empty($conditions['search'])) {
            $term = '%' . $conditions['search'] . '%';
            $where[] = '(t.nome LIKE ? OR wm.nome LIKE ? OR wi.id LIKE ? OR t.id LIKE ?)';
            $params = array_merge($params, [$term, $term, $term, $term]);
        }

        if ($where) {
            $query .= ' WHERE ' . implode(' AND ', $where);
        }

        $orderClause = $orderBy !== '' ? $orderBy : 't.id DESC';
        $orderClause = preg_replace('/[^a-zA-Z0-9_,.\s]/', '', $orderClause);
        $query .= ' ORDER BY ' . $orderClause;

        $rows = $this->db->select($query, $params) ?: [];
        foreach ($rows as &$row) {
            if (!isset($row['id_workflow'])) {
                $row['id_workflow'] = $row['workflow_modello_id'];
            }
            if (!isset($row['id_utente_assegnato'])) {
                $row['id_utente_assegnato'] = $row['assegnato_a_utente_id'];
            }
            if (!isset($row['id_istanza_workflow'])) {
                $row['id_istanza_workflow'] = $row['workflow_istanza_id'];
            }
            if (!isset($row['stato_nome'])) {
                $row['stato_nome'] = $row['stato'];
            }
        }

        return $rows;
    }

    public function find($id): bool
    {
        $sql = "SELECT
                    t.*,
                    wi.workflow_modello_id,
                    wp.ordine AS step_ordine,
                    wp.sottopasso AS step_sottopasso
                FROM {$this->table_name} t
                LEFT JOIN workflow_istanze wi ON wi.id = t.workflow_istanza_id
                LEFT JOIN workflow_passi wp ON wp.id = t.workflow_passo_id
                WHERE t.id = ?";

        $row = $this->db->selectOne($sql, [$id]);
        if (!$row) {
            return false;
        }

        foreach ($row as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }

        $this->workflow_modello_id = $row['workflow_modello_id'] ?? null;
        $this->step_ordine = $row['step_ordine'] ?? null;
        $this->step_sottopasso = $row['step_sottopasso'] ?? null;

        return true;
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
        if ($this->stato !== self::STATO_APERTO) {
            // Non si può assegnare un task già in lavorazione o chiuso.
            return false;
        }

        $this->assegnato_a_utente_id = $id_utente;
        $this->stato = self::STATO_IN_LAVORAZIONE;
        $this->assegnato_il = date('Y-m-d H:i:s');
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
        if ($this->stato !== self::STATO_IN_LAVORAZIONE) {
            // Non si può chiudere un task non ancora preso in carico o già chiuso.
            return false;
        }

        $this->stato = self::STATO_CHIUSO;
        $this->completato_il = date('Y-m-d H:i:s');
        // Potremmo anche voler rimuovere l'utente assegnato, ma per ora lo lasciamo
        // per mantenere lo storico di chi ha completato il lavoro.
        return true;
    }

    private function mapLegacyStateId(int $id): ?string
    {
        switch ($id) {
            case 1:
                return self::STATO_APERTO;
            case 2:
                return self::STATO_IN_LAVORAZIONE;
            case 3:
                return self::STATO_CHIUSO;
            default:
                return null;
        }
    }

}
