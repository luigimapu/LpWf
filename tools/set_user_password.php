<?php
// Set or reset a user's password by email
// Usage: php tools/set_user_password.php <email> <new_password>

require_once __DIR__ . '/../config/env_loader.php';
require_once __DIR__ . '/../config/Database.php';

$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    loadEnv($envPath, false);
}

if ($argc < 3) {
    fwrite(STDERR, "Usage: php tools/set_user_password.php <email> <new_password>\n");
    exit(1);
}

$email = $argv[1];
$newPassword = $argv[2];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Invalid email format\n");
    exit(1);
}
if ($newPassword === '') {
    fwrite(STDERR, "Password must not be empty\n");
    exit(1);
}

$db = new Database();

$user = $db->selectOne('SELECT id, email FROM utenti WHERE email = ? LIMIT 1', [$email]);
if (!$user) {
    fwrite(STDERR, "User not found: {$email}\n");
    exit(2);
}

$hash = password_hash($newPassword, PASSWORD_DEFAULT);
if ($hash === false) {
    fwrite(STDERR, "Failed to hash password\n");
    exit(1);
}

$updated = $db->executeStatement('UPDATE utenti SET password_hash = ? WHERE id = ?', [$hash, (int)$user['id']]);
if ($updated === false) {
    fwrite(STDERR, "Failed to update password for {$email}\n");
    exit(3);
}

echo "Password updated for {$email}\n";
