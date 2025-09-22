<?php

class Database
{
    // --- MODIFICA QUESTE CREDENZIALI CON LE TUE ---
    private $host = '95.110.227.54';
    private $db_name = 'LpFlow2';
    private
     $username = 'luigimapu'; // Sostituisci con il tuo username
    private $password = 'Giggino_81'; // Sostituisci con la tua password
    // ---------------------------------------------

    public $conn;

    /**
     * Il costruttore stabilisce la connessione al database.
     */
    public function __construct()
    {
         $this->host = getenv('DB_HOST') ?: 'localhost';
    $this->db_name = getenv('DB_NAME') ?: 'LpFlow2';
    $this->username = getenv('DB_USER') ?: 'root';
    $this->password = getenv('DB_PASS') ?: '';
        $this->conn = null;
        try {
            $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8';
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $exception) {
            // Blocca l'esecuzione e mostra un errore generico in produzione
            die("Errore di connessione al database. Verificare le credenziali nel file Database.php.");
        }
    }

    /**
     * Esegue una query SELECT e restituisce TUTTE le righe corrispondenti.
     * @param string $sql La query SQL.
     * @param array $params I parametri per la query preparata.
     * @return array|false Un array di risultati o false in caso di errore.
     */

    public function select($sql, $params = [])
    {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
           // print_r($stmt->);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            // Logga l'errore invece di mostrarlo
            // error_log("Errore SELECT: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Esegue una query SELECT e restituisce SOLO la prima riga corrispondente.
     * @param string $sql La query SQL.
     * @param array $params I parametri per la query preparata.
     * @return array|false Un array associativo per la riga trovata, o false se non trova nulla o in caso di errore.
     */
    public function selectOne($sql, $params = [])
    {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            // Usa fetch() per ottenere solo la prima riga come array associativo
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Logga l'errore invece di mostrarlo
            // error_log("Errore SELECT ONE: " . $e->getMessage());
            return false;
        }
    }


    /**
     * Esegue una query di INSERT, UPDATE o DELETE in modo sicuro.
     */
    public function executeStatement($sql, $params = [])
    {
        try {
            //print_r($params);
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            // error_log("Errore Execute: " . $e->getMessage());
            return false;
        }
    }

    // --- NUOVI METODI PER LE TRANSAZIONI ---

    /**
     * Inizia una nuova transazione.
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    /**
     * Esegue il commit della transazione corrente.
     */
    public function commit() {
        return $this->conn->commit();
    }

    /**
     * Esegue il rollback della transazione corrente.
     */
    public function rollBack() {
        return $this->conn->rollBack();
    }




    /**
     * Restituisce l'ID dell'ultima riga inserita.
     */
    public function lastInsertId()
    {
        return $this->conn->lastInsertId();
    }

    /**
     * Chiude la connessione (impostando a null).
     */
    public function __destruct()
    {
        $this->conn = null;
    }
}