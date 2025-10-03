<?php
require_once __DIR__ . '/../config/Database.php';

function println($m){ echo $m.PHP_EOL; }

$db = new Database();
$exists = $db->selectOne("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_role_audit'");
if ((int)($exists['cnt'] ?? 0) > 0) { println('[OK] Tabella user_role_audit già esistente.'); exit(0); }

$sql = <<<SQL
CREATE TABLE user_role_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_user_id BIGINT UNSIGNED NOT NULL,
  old_role VARCHAR(32) NULL,
  new_role VARCHAR(32) NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_user (target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

$res = $db->executeStatement($sql);
if ($res === false) { println('[ERR] Creazione tabella fallita'); exit(1); }
println('[OK] Tabella user_role_audit creata.');
