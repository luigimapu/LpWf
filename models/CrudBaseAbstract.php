<?php
require_once __DIR__ . '/../config/Database.php';

abstract class CrudBaseAbstract

{
    // Proprietà protette
    protected $db; // Istanza di Database
    protected $table_name;
    protected $fillable_fields = [];

    // Proprietà pubbliche (per i dati del record)
    public $id;

    /**
     * Costruttore.
     * @param Database $db L'oggetto Database per la connessione.
     */
    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    /**
     * Converte le proprietà pubbliche dell'oggetto in un array associativo.
     * Questo è utile per la serializzazione in JSON.
     * @return array
     */
    public function toArray(): array
    {
        $data = [];
        // Usiamo la Reflection per leggere dinamicamente le proprietà pubbliche della classe figlia (es. Utente, Task)
        $reflect = new ReflectionClass($this);
        $props = $reflect->getProperties(ReflectionProperty::IS_PUBLIC);

        foreach ($props as $prop) {
            $propName = $prop->getName();
            // Ignoriamo eventuali proprietà che non vogliamo esporre, come l'oggetto db se fosse pubblico
            if ($prop->isInitialized($this)) {
                $data[$propName] = $this->{$propName};
            }
        }
        return $data;
    }

    /**
     * Trova un singolo record per ID e popola le proprietà dell'oggetto.
     * @param int $id L'ID del record da trovare.
     * @return bool True se trovato, false altrimenti.
     */
    public function find($id): bool
    {
        $sql = "SELECT * FROM {$this->table_name} WHERE id = ?";
       // print_r($sql);
        $result = $this->db->select($sql, [$id]);

        if ($result && count($result) > 0) {
            $row = $result[0];
            // Popola dinamicamente le proprietà dell'oggetto
            foreach ($row as $key => $value) {
                if (property_exists($this, $key)) {
                    $this->$key = $value;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Trova tutti i record, con condizioni e ordinamento opzionali.
     * Mantiene la compatibilità con la vecchia chiamata findAll('ordine').
     *
     * Esempi di chiamata:
     * $model->findAll(); // Restituisce tutto
     * $model->findAll('nome ASC'); // Restituisce tutto, ordinato
     * $model->findAll(['attivo' => 1]); // Restituisce dove attivo = 1
     * $model->findAll(['attivo' => 1], 'nome DESC'); // Condizione e ordine
     *
     * @param array|string $conditions o un array di condizioni o una stringa di ordinamento.
     * @param string $orderBy La clausola ORDER BY (usata se il primo parametro è un array).
     * @return array La lista di record trovati.
     */
    public function findAll($conditions = [], string $orderBy = ''): array
    {
        //print_r($conditions);
        // Per retrocompatibilità: se il primo argomento è una stringa, lo tratto come $orderBy
        if (is_string($conditions)) {
            $orderBy = $conditions;
            $conditions = [];
        }

        $sql = "SELECT * FROM {$this->table_name}";
        $params = [];

        if (!empty($conditions)) {
            $sql .= " WHERE ";
            $parts = [];
            foreach ($conditions as $key => $value) {
                $parts[] = "`$key` = ?";
                $params[] = $value;
            }
            $sql .= implode(' AND ', $parts);
        }
        //print_r($params);
        if (!empty($orderBy)) {
            // Semplice pulizia per prevenire SQL injection nell'ORDER BY
            $allowedOrderBy = preg_replace('/[^a-zA-Z0-9_, ASCascDESCdesc ]/', '', $orderBy);
            if (!empty($allowedOrderBy)) {
                $sql .= " ORDER BY " . $allowedOrderBy;
            }
        }
        
        $results = $this->db->select($sql, $params);
        return $results ?: [];
    }
    
    /**
     * Crea un nuovo record basato sulle proprietà dell'oggetto.
     * @return bool True se la creazione ha successo, false altrimenti.
     */
    public function create(): bool
    {
        $fields = [];
        $placeholders = [];
        $params = [];

        foreach ($this->fillable_fields as $field) {
            if (property_exists($this, $field) && !is_null($this->$field)) {
                $fields[] = "`$field`";
                $placeholders[] = "?";
                $params[] = $this->$field;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "INSERT INTO {$this->table_name} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";

        $rowCount = $this->db->executeStatement($sql, $params);

        if ($rowCount > 0) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * SOSTITUITO: Aggiorna un record esistente basato su un array di dati.
     * La funzione ora filtra i dati in base a $fillable_fields per sicurezza.
     * @param array $data Un array associativo di [colonna => valore] da aggiornare.
     * @return bool True se l'aggiornamento ha successo, false altrimenti.
     */
    public function update(array $data): bool
    {
        if (empty($this->id)) {
            return false; // L'oggetto deve essere prima caricato con find()
        }

        $fields_to_update = [];
        $params = [];

        // Itera sui campi "fillable" per costruire una query sicura
        foreach ($this->fillable_fields as $field) {
            // Controlla se il campo è presente nei dati forniti dal chiamante
            if (array_key_exists($field, $data)) {
                $fields_to_update[] = "`$field` = ?";
                // Converte le stringhe vuote in null per coerenza con il DB
                $params[] = ($data[$field] === '') ? null : $data[$field];
            }
        }

        if (empty($fields_to_update)) {
            return false; // Nessun dato valido da aggiornare è stato fornito
        }

        $params[] = $this->id; // Aggiungi l'ID per la clausola WHERE
        $sql = "UPDATE {$this->table_name} SET " . implode(', ', $fields_to_update) . " WHERE id = ?";

        // executeStatement restituisce il numero di righe o false in caso di errore
        return $this->db->executeStatement($sql, $params) !== false;
    }

    /**
     * Cancella un record basato sull'ID dell'oggetto.
     * @return bool True se la cancellazione ha successo, false altrimenti.
     */
    public function delete(): bool
    {
        if (empty($this->id)) {
            return false;
        }
        $sql = "DELETE FROM {$this->table_name} WHERE id = ?";
        return $this->db->executeStatement($sql, [$this->id]) > 0;
    }

    /**
     * Restituisce il nome della tabella gestita dal modello.
     * @return string
     */
    public function getTableName(): string
    {
        return $this->table_name;
    }

    /**
     * NUOVO: Restituisce l'array dei campi compilabili per il debug.
     * @return array
     */
    public function getFillableFields(): array
    {
        return $this->fillable_fields;
    }

}