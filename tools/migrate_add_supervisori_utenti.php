<?php
require_once __DIR__ . '/../config/Database.php';

function println($m){ echo $m.PHP_EOL; }

$db = new Database();
$exists = $db->selectOne("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'supervisori_utenti'");
if ((int)($exists['cnt'] ?? 0) > 0) { println('[OK] Tabella supervisori_utenti già esistente.'); exit(0); }

$sql = <<<SQL
CREATE TABLE supervisori_utenti (
  supervisor_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (supervisor_id, user_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_su_supervisor FOREIGN KEY (supervisor_id) REFERENCES utenti(id) ON DELETE CASCADE,
  CONSTRAINT fk_su_user FOREIGN KEY (user_id) REFERENCES utenti(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

$res = $db->executeStatement($sql);
if ($res === false) { println('[ERR] Creazione tabella fallita'); exit(1); }
println('[OK] Tabella supervisori_utenti creata.');
