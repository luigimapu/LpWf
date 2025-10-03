<?php

class HubDatabase
{
    private string $host;
    private string $dbName;
    private string $username;
    private string $password;
    public ?PDO $conn = null;

    public function __construct()
    {
        $this->host = getenv('HUB_DB_HOST') ?: 'localhost';
        $this->dbName = getenv('HUB_DB_NAME') ?: '';
        $this->username = getenv('HUB_DB_USER') ?: '';
        $this->password = getenv('HUB_DB_PASS') ?: '';

        if ($this->dbName === '' || $this->username === '') {
            throw new RuntimeException('Configurazione database hub incompleta.');
        }

        $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->dbName . ';charset=utf8mb4';
        $this->conn = new PDO($dsn, $this->username, $this->password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    public function select(string $sql, array $params = []): array
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return $rows ?: [];
    }

    public function selectOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row !== false ? $row : null;
    }

    public function executeStatement(string $sql, array $params = []): int
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    public function lastInsertId(): string
    {
        return $this->conn->lastInsertId();
    }
}

