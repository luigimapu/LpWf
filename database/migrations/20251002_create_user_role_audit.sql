-- Crea tabella audit per cambi ruolo utente
CREATE TABLE IF NOT EXISTS user_role_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_user_id BIGINT UNSIGNED NOT NULL,
  old_role VARCHAR(64) NULL,
  new_role VARCHAR(64) NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_role_target (target_user_id),
  INDEX idx_user_role_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

