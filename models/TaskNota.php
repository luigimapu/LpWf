<?php
require_once __DIR__ . '/CrudBaseAbstract.php';

class TaskNota extends CrudBaseAbstract
{
    protected $table_name = "task_note";
    protected $fillable_fields = ['id_task', 'id_utente', 'nota'];

    public $id;
    public $id_task;
    public $id_utente;
    public $nota;
    public $data_creazione;

    /**
     * SOVRASCRITTO: Recupera tutte le note per un task, includendo i dati dell'utente.
     */
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        // Usiamo GROUP_CONCAT per aggregare gli allegati in una stringa JSON per ogni nota
        $query = "SELECT 
                    tn.id, tn.nota, tn.data_creazione,
                    u.nome as utente_nome,
                    u.cognome as utente_cognome,
                    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', tna.id, 'nome_file', tna.nome_file_originale, 'percorso', tna.percorso_file)) 
                     FROM task_note_allegati tna WHERE tna.id_nota = tn.id) as allegati
                  FROM {$this->table_name} tn
                  LEFT JOIN utenti u ON tn.id_utente = u.id";

        $params = [];
        if (!empty($conditions['id_task'])) {
            $query .= " WHERE tn.id_task = ?";
            $params[] = $conditions['id_task'];
        }

        $query .= " GROUP BY tn.id ORDER BY tn.data_creazione ASC";

        $results = $this->db->select($query, $params) ?: [];

        // Decodifichiamo la stringa JSON degli allegati in un vero array
        foreach ($results as &$row) {
            $row['allegati'] = $row['allegati'] ? json_decode($row['allegati']) : [];
        }

        return $results;

    }
}